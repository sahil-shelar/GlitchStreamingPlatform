const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}

/*
Purpose

** The asyncHandler function is a higher-order function designed to simplify error handling in asynchronous route handlers or middleware functions in Express.js. It ensures that any errors occurring in asynchronous code are properly caught and passed to the next error-handling middleware.

1. const asyncHandler: Declares a constant named asyncHandler.

2. (requestHandler) => {: This is an arrow function that takes one argument, requestHandler. The requestHandler is expected to be an asynchronous function (i.e., a function that returns a promise).

3. return: The asyncHandler function returns another function.

4. (req, res, next) => {: This returned function takes three arguments:
- req: The request object.
- res: The response object.
- next: The next middleware function in the Express.js request-response cycle.

5. Promise.resolve(requestHandler(req, res, next)):
- Calls the requestHandler function with req, res, and next as arguments.
- requestHandler(req, res, next) is expected to return a promise.
- Promise.resolve() ensures that the return value is treated as a promise. If requestHandler doesn't return a promise, 
  Promise.resolve will wrap it in a resolved promise.

6. .catch((err) => next(err)):
- If the promise returned by requestHandler is rejected (an error occurs), .catch catches the error.
- The caught error (err) is passed to next(err), which triggers the next error-handling middleware in the Express.js stack.
*/