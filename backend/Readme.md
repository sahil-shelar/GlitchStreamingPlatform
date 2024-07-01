Things to remember while creating the a project.

1. **File Structure**

- Create a separate folder for the project.
- Inside the folder, create separate folders for different components like images, styles, scripts, etc.

* **DB config**
- mongodb uri : mongodb+srv://sahil:OGGY41414@cluster0.cvp0pmz.mongodb.net/
- id: sahil
- password: OGGY41414

2. **DB connection**

- Create a separate file for database connection.
- Use environment variables for database URI and other sensitive information.
- There are two ways to connect to DB, where in first way is to write the connection function in index file since its getting excuted first as IIFEE and second way is to create a DB folder with db.js file and export that file to index this way it is more modular and cleaner
- Whener we communicate to DB there will be errors hence always wrap in try catch block or promises
- DB is always in another continent, hence it takes time to communicate hence use async await always

3. **Middleware**

- Middlewares are functions that execute during the lifecycle of a request to the server in an Express.js application. They have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle.
- Create a separate folder for middleware.
- Middleware functions are used to perform specific tasks such as authentication, input validation, etc.
- Always use next() function to pass the control to the next middleware function or route handler.
- Always handle errors in middleware functions using try-catch blocks or promises.

* Steps of Middleware Working
1. Incoming Request:
- A client sends a request to the server.

2. Middleware Function:
- Middleware functions are functions that process the incoming request.
- Each middleware function can read, modify, or respond to the request.

2. Registering Middleware:
- Middleware is registered using app.use() or directly in route handlers.

3. Execution Order:
- Middleware functions are executed in the order they are registered.

4. Processing the Request:
- Middleware can perform various tasks such as logging, parsing data, or authenticating users.

5. Calling next():
- Each middleware function must call next() to pass control to the next middleware function.
- If next() is not called, the request will not move forward and can get stuck.

6. Reaching Route Handler:
- After all middleware functions have been executed, the request reaches the route handler.
- The route handler sends a response back to the client.

7. Error Handling:
- If an error occurs, it can be passed to an error-handling middleware.
- Error-handling middleware captures the error and sends an appropriate response to the client.


4. HTTP

- The structure of an HTTP request consists of two main parts: the header and the body. Together, they form the complete HTTP request message that a client (such as a web browser) sends to a server. Here’s how they are structured:

    1. HTTP Request Line
    The request line is the first line of the HTTP request and includes the following components:
    - HTTP Method: Specifies the HTTP method such as GET, POST, PUT, DELETE, etc.
    - Request Target: The URL or path to the requested resource on the server.
    - HTTP Version: Indicates the version of HTTP being used, such as HTTP/1.1 or HTTP/2.

    2. HTTP Request Headers
    HTTP headers provide additional information about the request or about the client itself. They follow the request line and consist of key-value pairs separated by a colon (:). Common headers include:
    - Host: Specifies the domain name of the server (required in HTTP/1.1 requests).
    - User-Agent: Identifies the client making the request (e.g., the browser or user agent).
    - Content-Type: Specifies the media type of the body of the request (e.g., application/json).
    - Authorization: Contains credentials for authenticating the client with the server.
    - Accept: Lists acceptable media types for the response.

    4. HTTP Request Body
    The body of an HTTP request contains any additional data that the client wants to send to the server. Not all requests have a body (e.g., GET requests typically do not), but for methods like POST or PUT, the body might contain form data, JSON, XML, or other content types.

    POST /login HTTP/1.1
    Host: www.example.com
    User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.999 Safari/537.36
    Content-Type: application/json
    Content-Length: 49

    {
    "username": "example_user",
    "password": "example_password"
    }
