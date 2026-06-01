import express from "express";
import {OrderBook} from "./orderbook";
import type {Order,Users} from "./types";

const app=express();
app.use(express.json());

const orderBook=new OrderBook();
const users:Users[]=[
    {id:1,name:"prince",balance:200000,lockedBalance:0},
    {id:2,name:"Rahul",balance:200000,lockedBalance:0}
];

function findUserById(userId:number):Users|undefined{
    return users.find(user=>user.id === userId);
}
// helper funcionn for the update Status 
function updateOrderStatus(order:Order){
    if(order.quantity===0){
        order.status="filled";
    }else if(order.quantity<order.originalQuantity){
        order.status="partial";
    }else{
        order.status="open";
    }
}

function isValidOrder(order: any): order is Order {
    if (typeof order.id !== "number") return false;
    if (order.side !== "buy" && order.side !== "sell") return false;
    if (typeof order.price !== "number" || order.price <= 0) return false;
    if (typeof order.quantity !== "number" || order.quantity <= 0) return false;

    return true;
}
app.get("/users",(req,res)=>{
    res.json({users})
})

app.get("/",(req,res)=>{
    res.json({
        message:"server running"
    });
})
// order api to put the data in orderbook
app.post("/orders",(req,res)=>{
    const order:Order={
        ...req.body,
        orignalQuantity:req.body.quantity,
        status:"open"};
    const user = findUserById(order.userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    if(order.side==="buy" && user.balance<order.price*order.quantity){
        return res.status(400).json({
            message:"Insufficient balance"
        })
    }
    if(order.side==="buy"){
        const requiredBalance=order.price*order.quantity;
        user.balance -= requiredBalance;
        user.lockedBalance += requiredBalance;
    }
    if (!isValidOrder(order)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order"
        });
    }
    
    orderBook.addOrder(order);
    const fills=orderBook.matchOrders();
    // updating seller balance
    for(const fill of fills){
        const seller=findUserById(fill.sellerId);
        if(seller){
            seller.balance+=fill.price*fill.quantity;
        }
    }
    res.json({
        success:true,
        message:"Order Processed",
        fills,
        orderbook:orderBook
    });
});
app.delete("/orders/:id",(req,res)=>{
    const orderId=Number(req.params.id);
    const cancelledorder=orderBook.cancelOrder(orderId);
    if(!cancelledorder){
        return res.status(404).json({
            success:false,
            message:"Order not Found"
        });
    }
    const user=findUserById(cancelledorder.userId);
    if(user && cancelledorder.side === "buy"){
        const refund=cancelledorder.price*cancelledorder.quantity;
        user.lockedBalance-=refund;
        user.balance+=refund;
    }
    res.json({
        success:true,
        message:"order cancelled",
        cancelledorder,
        users,
    })
})


//can-match api to match the data in the orderbook
app.get("/can-match",(req,res)=>{
    const canMatch=orderBook.canMatch();
    res.json({
        canMatch:canMatch
    });
});

app.get("/orderbook",(req,res)=>{
    res.json(orderBook);
})
app.get("/fills", (req, res) => {
    res.json({
        fills: orderBook.fills
    });
});

app.listen(3000,()=>{
    console.log("Backend is running on port 3000");
})