import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import path from 'path';
import fs from 'fs';
import { v4 } from 'uuid';

const app = express();
let port;
if (!process.env.PORT) {
    port = 4000;
} else {
    port = process.env.PORT
}

const books = [
    {
        title: 'Harry Potter and the Chamber of Secrets',
        author: 'J.K. Rowling',
    },
    {
        title: 'Jurassic Park',
        author: 'Michael Crichton',
    },
];

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }

  type FileInfo {
    id: ID
    path: String
  }

  type Mutation {
    uploadFile(file: Upload!, customFileName: String): FileInfo
  }
`;

const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

function storeFile({ stream, filename })  {
    const id = v4();

    const path = `${UPLOAD_DIR}/${id}-${filename}`;

    console.log(filename);

    return new Promise((resolve, reject) => stream
        .on('error', error => {
            if (stream.truncated) {
                // delete truncated file
                fs.unlinkSync(path);
            }

            reject(error);
        })
        .pipe(fs.createWriteStream(path))
        .on('error', error => reject(error))
        .on('finish', () => resolve({ id, path }))
    );
}

const resolvers = {
    Query: {
        books: () => books,
    },
    Mutation: {
        uploadFile: async (parent, { file, customFileName }, context) => {
            const { createReadStream, filename, mimetype } = await file;

            const stream = createReadStream();

            console.log(customFileName);

            const { id, path } = await storeFile({ 
                stream,
                filename: customFileName ? customFileName : filename 
            });

            return { id, path };
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

server.applyMiddleware({ app })

app.get('/hello', (req, res) => res.send('Hello World!'))


// Serving react client
if (process.env.NODE_ENV === 'production') {

    app.use(express.static(path.join(__dirname, '../../client/build')));

    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
    });
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
