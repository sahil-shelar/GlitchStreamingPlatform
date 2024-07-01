import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () =>{
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) //mongoose return an object
        console.log(`Connected to MongoDB on ${connectInstance.connection.host}`) //make sure which host is connected to

    }catch(error){
        console.log(error);
        process.exit(1)
    }
}

export default connectDB;

/*Notes to Remember


# Connecting database in MERN with debugging

- Created MongoDb Atlas account.
- Created a Database and connect I.P Address to access database from anywhere.
- Used `dotenv , mongoose , express` packages.
- Two important points about database connectivity: 
    1. When connecting to databases, handling potential data-not-found scenarios is essential. Employ try/catch blocks or promises to manage errors or we can also use promises.
        - key to remember : ( wrap in try-catch )
    2. Database operations involve latency, and traditional synchronous code can lead to blocking, where the program waits for the database query to complete before moving on. So, we should async/await which allows for non-blocking execution, enabling the program to continue with other tasks while waiting for the database response. 
        - key to remember :  ( always remember the database is in another continent, so use async await)
- Used two approach to connect the database - 1. In Index File, 2. In Seprate DB file


1. mongoose.connect() returns a promise, so we use async/await to handle it.
2. We use the environment variable MONGODB_URI to connect to the MongoDB instance.
3. We use the DB_NAME constant to specify the database name.
4. We log a success message to the console when the connection is established.
5. If an error occurs, we log the error to the console and exit the process with a status code of 1 using process.exit(1). This ensures that the application does not continue running if the database connection fails.


1. Async/Await:
Ensures the connection to MongoDB is established before proceeding.
Helps manage asynchronous code more cleanly.

2. Environment Variables:
process.env.MONGODB_URI is used to keep the database URI secure and configurable.
DB_NAME is imported from a constants file for flexibility and maintainability.

3. Error Handling:
Errors are caught and logged, ensuring that any issues during the connection process are visible.
process.exit(1) is used to terminate the application if a connection error occurs, indicating a failure state.

4. Connection Feedback:
Logs the host of the MongoDB connection, which is useful for debugging and ensuring the correct database is connected.

5. Importing and Exporting:
Uses ES6 module syntax (import and export) for cleaner and more modern JavaScript code.

*/