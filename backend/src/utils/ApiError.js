class ApiError extends Error{
    constructor(
        statueCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statueCode = statueCode
        this.stack = stack
        this.data = null
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }