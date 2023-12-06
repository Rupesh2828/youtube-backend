class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        //The super keyword is used to call the constructor of the superclass (Error in this case)
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
        //Error.captureStackTrace method is called to capture the current stack trace and associate it with the instance. This is useful for debugging, as it provides information about the call stack leading up to the creation of the error.

    }
}

export {ApiError}