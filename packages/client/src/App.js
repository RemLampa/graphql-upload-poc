import React, { Component } from 'react';
import './App.css';

import { ApolloProvider } from "react-apollo";

import { Query } from "react-apollo";
import gql from "graphql-tag";

import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createUploadLink } from 'apollo-upload-client';
import { Mutation } from 'react-apollo';

const link = createUploadLink({ uri: '/graphql' });

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

const Books = () => (
  <Query
    query={gql`
      {
        books {
            title
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;

      return <pre>{data.books[0].title}</pre>;
    }}
  </Query>
);

const FILE_UPLOAD_MUTATION = gql`
  mutation($file: Upload!) {
    uploadFile(file: $file) {
      id
      path
    }
  }
`;

class App extends Component {
  state = {
    customFileName: null,
    file: null,
  };

  handleFilenameChange = e => {
    e.preventDefault();

    console.log(e.target.value);

    this.setState({ customFileName: e.target.value });
  }

  handleFileChange = ({ target: { validity, files: [file] } }) => {
    if (!validity.valid) {
      return;
    }

    return this.setState({ file });
  }

  handleSubmit = mutate => {
    const { file, customFileName } = this.state;

    console.log(file, customFileName);

    if (!file) {
      return
    }

    return mutate({ variables: { file, customFileName } });
  }

  render() {
    return (
      <ApolloProvider client={client}>
        <div className="App">
          <Books />
          <Mutation mutation={FILE_UPLOAD_MUTATION}>
              {mutate => (
                <form onSubmit={e => { e.preventDefault(); this.handleSubmit(mutate); }}>
                  <input type="text" onChange={this.handleFilenameChange} placeholder="filename"/>
                  <input
                    type="file"
                    required
                    onChange={this.handleFileChange}
                />
                    <button type="submit">Upload</button>
                  </form>
              )}
          </Mutation>
        </div>
      </ApolloProvider>
    );
  }
}

export default App;
