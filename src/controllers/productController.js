const userModel = require("../models/userModel")
const {redis,validator,aws} = require("../utils")

const productModel = require("../models/productModel")


const newProduct = async function(req,res){
    try{
        if(Object.keys(req.body).length==0){
            return res.status(400).send({status:false, message:"pls provide product details"}) 
        }

        console.log(req.body)
        let {title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments,productImage}=req.body

        let mandatoryFields = ["title","description","price","availableSizes"]

        for(let key of mandatoryFields){
            if(!validator.isValid(req.body[key])){
                return res.status(400).send({status:false, message:`value of ${key} must be present `}) 
            }
        }

        let lettersField = ["title","style"]
        for(let key in req.body){
            if(lettersField.includes(key) && !validator.isLetters(req.body[key])){
                return res.status(400).send({status:false,message:`${key} can only contain string of letters`})
            }
        }
        
        let numberfields = ["price","installments"]
        for(let key in req.body){
            key=Number(key)
            if(numberfields.includes(key) && typeof key != "number"){
                return res.status(400).send({status:false,message:`${key} should be type number`})
            }
        }

        let currId = "INR"
        let currFormat = "₹"
        if(currencyId){
            if(currencyId!=currId){
                return res.status(400).send({status:false, message:"only Indian currencyId is valid"})
            }
        }
        if(currencyFormat){
            if(currencyFormat!=currFormat){
                return res.status(400).send({status:false, message:"only Indian currencyFormat is valid"})
            }
        }

        if(isFreeShipping){
            if(typeof isFreeShipping !== "boolean"){
                return res.status(400).send({status:false, message:"Type of isFreeShipping should be boolean"})
            }
        }

        ///  availableSizes = "  s , xl " // = [" s , xl "] // ["  s ","    xl"] ====== ["S","XL"]

        if(availableSizes){
            // try{

            // }
            // catch(err){

            // }
                // console.log(availableSizes)
                console.log(JSON.parse(availableSizes))
                let arr2 = ["S", "XS","M","X", "L","XXL", "XL"]
                if (typeof availableSizes == "string") {
                    let arr = availableSizes.split(",").join(" ")
                    arr = arr.split(" ").filter(x=>x.trim().length>0).map(x=>x.trim().toUpperCase())
                    // console.log(arr)
                    for (let i = 0; i < arr.length; i++) {
                        let x =arr[i]
                        if(!arr2.includes(x)){
                            return res.status(400).send({status:false , message : `only these ${arr2.join(",")} sizes are allowed`})
                        }
                    }
                    availableSizes = arr
                    
                }
            //     else if (Array.isArray(availableSizes)){
            //        let arr= availableSizes
            //     //    arr = arr.map(x=>x.split(",").map(x=>x.trim())).map(x=>x.split(" ").map(x=>x.trim())).filter(x=>x.trim().length>0).flat(Infinity)

            //         arr=arr.map(x=>x.trim().split(",").map(x=>x.trim().toUpperCase())).flat(Infinity).filter(x=>x.trim().length>0)
            //         console.log("arr")
            //         for (let i = 0; i < arr.length; i++) {
            //             let x =arr[i]
            //             if(!arr2.includes(x)){
            //                 return res.status(400).send({status:false , message : `only these ${arr2} sizes are allowed`})
            //             }
            //         }
            //         availableSizes = arr
            //     }
            // console.log(availableSizes)
        }


        
        const files = req.files

        if(files && files.length>0){
            const url = await aws.uploadFile(files[0])
            productImage = url
        }
        else{
            return res.status(400).send({status:false, message:"no file found"})
        }

        const duplicateData= await productModel.findOne({title})
        if(duplicateData){
            return res.status(409).send({status:false, message:"Title is already taken"})
        }
        const data = {title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments,productImage}

        const newProduct = await productModel.create(data)

        return res.status(201).send({status:true, message:"Product created successfully", data:newProduct})

    }catch(err){  
        return res.status(500).send({status:false, message:err.message})    
    }
}


const updateProduct = async function(req,res){
    try{
        const productId = req.params.productId

        if(!validator.isValidObjectId(productId)){
            return res.status(400).send({status:false, message:"Invalid productId"})
        }
        if(Object.keys(req.body).length==0){
            return res.status(400).send({status:false, message:"pls provide product details for updation"}) 
        }

        let {title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments,productImage}=JSON.parse(req.body.data)

        let filter = {}
        if(title){
            if(!validator.isLetters(title)){
                return res.status(400).send({status:false, message:"Title can only contain string of letters "})
            }
            const dupData= await productModel.findOne({title})

            if(dupData){
                return res.status(409).send({status:false, message:"Title is already taken"})
            }
            filter.title = title
        }
        if(description){
            if(!validator.isLetters(description)){
                return res.status(400).send({status:false, message:"Description can only contain string of letters "})
            }
            filter.description = description
        }
        if(price){
            if(typeof price != "number"){
                return res.status(400).send({status:false, message:"Price should be type number"})
            }
            filter.price = price
        }
        if(currencyId){
            let currId = "INR"
            if(currencyId!=currId){
                return res.status(400).send({status:false, message:"only Indian currencyId is valid"})
            }
            
        }
        if(currencyFormat){
            let currFormat = "₹"
            if(currencyFormat!=currFormat){
                return res.status(400).send({status:false, message:"only Indian currencyFormat is valid"})
            }
            
        }
        if(isFreeShipping){
            if(typeof isFreeShipping !== "boolean"){
                return res.status(400).send({status:false, message:"Type of isFreeShipping should be boolean"})
            }
            filter.isFreeShipping = isFreeShipping
        }
        if(style){
            if(!validator.isLetters(style)){
                return res.status(400).send({status:false, message:"Style should be a string and not empty"})
            }
            filter.style = style
        }
       //// // if(availableSizes){
           /// // if(!validator.isStringsArray(availableSizes)){
          ///  //     return res.status(400).send({status:false, message:"Available sizes should be an array of strings and should contain only these values [S, XS , M , X, L , XXL , XL]"})
          ///  // }
           /// // filter.availableSizes = availableSizes
        ////// }

        if(installments){
            if(typeof installments !== "number"){
                return res.status(400).send({status:false, message:"Type of installment should be number"})
            }
            filter.installments = installments
        }

        const files = req.files

        if(files && files.length>0){
            const url = await aws.uploadFile(files[0])
            filter.productImage = url
        }
        

        const updatedProduct = await productModel.findOneAndUpdate({_id:productId,isDeleted:false},filter,{new : true})

        return res.status(200).send({status:true, message:"Product updated successfully", data:updatedProduct})

    }catch(err){  
        return res.status(500).send({status:false, message:err.message})    
    }
}



const getById = async function(req,res){
    try{
        const productId = req.params.productId
        if(!validator.isValidObjectId(productId)){
            return res.status(400).send({status:false, message:"Invalid productId"})
        }

        const product = await productModel.findOne({_id:productId, isDeleted:false})
        if(!product){
            return res.status(404).send({status:false,message:"no product found"})
        }

        return res.status(200).send({status:true, data:product})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

const deleteProduct = async function(req,res){
    try{
        const productId = req.params.productId
        if(!validator.isValidObjectId(productId)){
            return res.status(400).send({status:false, message:"Invalid productId"})
        }

        const dProduct = await productModel.findOneAndUpdate({_id:productId,isDeleted:false},{isDeleted:true, deletedAt:new Date()})
        if(!dProduct){
            return res.status(404).send({status:false, message:"product does not exist"})
        }
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    }
}

const getByQuery = async function(req,res){
    try{
        const params = req.query 
        
        const {size,name,priceGreaterThan,priceLessThan}=params

        let availParams = ["size","name","priceGreaterThan","priceLessThan"]
        for(let key in params){
            if(!availParams.includes(key)){
                return res.status(400).send({status:false, message:`Query params can only be-${availParams.join(",")}`})
            }
        }

        for(let key in params){
            if(!validator.isValid(params[key])){
                return res.status(400).send({status:false, message:`${key} can't be empty`})
            }
        }

        if(size){
            if(Object.prototype.toString.call(size)=="[object String]"){
                let arrayOfSizes = validator.makingArray(size.toUpperCase())
                for(let i=0;i<arrayOfSizes.length;i++){
                    let arr=["S", "XS","M","X", "L","XXL", "XL"]
                    if(!arr.includes(i)){
                        return res.status(400).send({status:false, message:`size can only be from-${arr.join(",")}`})
                    }
                }
                params.size={$in:[...arrayOfSizes]}
            }
            else if(Object.prototype.toString.call(size)=="[object Array]"){
                size = size.map(x=>x.trim().split(" ").filter(x=>x.trim().length>0)).flat(Infinity)
                for(let i=0;i<size.length;i++){
                    let arr=["S", "XS","M","X", "L","XXL", "XL"]
                    if(!arr.includes(i)){
                        return res.status(400).send({status:false, message:`size can only be from-${arr.join(",")}`})
                    }
                }
                params.size={$in:[...size]}
            }
        }
        if(name){
            name=name.trim()
            if(!validator.isLetters(name)){
                return res.status(400).send({status:false, message:"product name can only contains letters"})
            }
            params.name={$regex:name, $options:"i"}
        }

        let arr=[priceGreaterThan,priceLessThan]

        if(priceLessThan && priceGreaterThan){
            params.price={$and:[{$gt:priceGreaterThan},{$lt:priceLessThan}]}
        }
        else{
            if(priceGreaterThan){
                if(typeof priceGreaterThan !="number"){
                    return res.status(400).send({status:false, message:`priceGreaterThan should be of number type`})
                }
                params.price={$gt:priceGreaterThan}
            }
            else if(priceLessThan){
                
                params.price={$lt:priceGreaterThan}
            }
        }
        params.isDeleted=false

        const product = await productModel.find(params).sort({price:1})
        console.log(product)
        if(product.length==0){
            return res.status(404).send({status:false, message:"no product found"})
        }

        return res.status(200).send({status:true, message:"products", data:product})
    }
    catch(err){
        return res.status(500).send({status:false, message:err.message})
    
    }
}





module.exports={
    newProduct,
    getById,
    deleteProduct,
    getByQuery,
    updateProduct
    
}