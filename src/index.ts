import express from "express";
import {OrderBook} from "./orderbook";
import type {Order} from "./types";

const app=express();
app.use(express.json());

const orderBook=new OrderBook();


function isValidOrder(order: any): order is Order {
    if (typeof order.id !== "number") return false;
    if (order.side !== "buy" && order.side !== "sell") return false;
    if (typeof order.price !== "number" || order.price <= 0) return false;
    if (typeof order.quantity !== "number" || order.quantity <= 0) return false;

    return true;
}

app.get("/",(req,res)=>{
    res.json({
        message:"server running"
    });
})
// order api to put the data in orderbook
app.post("/orders",(req,res)=>{
    const order=req.body;
    if (!isValidOrder(order)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order"
        });
    }
    
    orderBook.addOrder(order);
    const fills=orderBook.matchOrders();
    res.json({
        success:true,
        message:"Order Processed",
        fills,
        orderbook:orderBook
    });
});

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