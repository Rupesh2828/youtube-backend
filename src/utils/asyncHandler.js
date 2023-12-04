const asyncHandler = (requestHandler)=> {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}

//Below is alternate of promise, used async await with try catch wrapper.

// const asyncHandler = (requestHandler) => async(req,res,next) => {
//     try {
//         await requestHandler(req,res,next)
        
//     } catch (err) {
//         res.status(err.code || 500).json({
//             success:false,
//             message: err.message
//         })
        
//     }


// }

export {asyncHandler}