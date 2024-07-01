class ApiResponse {
    constructor(
        statuscode, 
        data, 
        mesasage = "Success"
    ){
        this.statuscode = statuscode;
        this.data = data;
        this.message = mesasage;
        this.success = statuscode < 400
    }
}

export { ApiResponse }