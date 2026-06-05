import express from "express";
import {OrderBook} from "./orderbook";
import type {Order,Users,Fill} from "./types";

const app=express();
app.use(express.json());
const port=process.env.PORT;

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
app.post("/orders", (req, res) => {
    const order: Order = {
        ...req.body,
        originalQuantity: req.body.quantity,
        status: "open"
    };

    const user = findUserById(order.userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    if (!isValidOrder(order)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order"
        });
    }
    

    // LIMIT BUY order balance check
    if (order.type === "limit" && order.side === "buy") {
        const requiredBalance = order.price * order.quantity;

        if (user.balance < requiredBalance) {
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        user.balance -= requiredBalance;
        user.lockedBalance += requiredBalance;
    }
    /// checking liquidity(enoght order in order book to buy or sell)
    if(order.type === "market" && order.side=== "buy"){
        if(!orderBook.hasEnoughSellLiquidity(order.quantity)){
            return res.status(400).json({
                message:"Not enough sell liquidity"
            });
        }
    }    

    if(order.type ==="market" && order.side ==="sell"){
        if(!orderBook.hasEnoughBuyLiquidity(order.quantity)){
            return res.status(400).json({
                message:"Not enough buy liquidity"
           });
        }
    }

    // check for market
    if(order.type==="market" && order.side==="buy"){
        const estimatedCost=orderBook.estimateMarketBuyCost(order.quantity);
        if(user.balance<estimatedCost){
            return res.status(400).json({
                message:"Insufficient balance for maket buy"
            });
        }
    }

    // LIMIT order goes into orderbook
    
    let fills:Fill[]=[];
    if(order.type==="limit"){
        orderBook.addOrder(order);
        fills = orderBook.matchOrders();
    }

    if(order.type==="market"){
        orderBook.allOrders.push(order);
        fills = orderBook.executeMarketOrder(order);
    }


    for (const fill of fills) {
        const buyer=findUserById(fill.buyerId);
        const seller = findUserById(fill.sellerId);
        const amount=fill.price*fill.quantity;

        if (seller) {
            seller.balance += amount;
        }
        if(buyer &&  order.type==="market" && order.side==="buy"){
            buyer.balance-=amount;
        }
        if(buyer && order.type==="limit" && order.side==="buy"){
            buyer.lockedBalance-= amount;
        }
    }

    res.json({
        success: true,
        message: "Order Processed",
        fills,
        orderbook: orderBook
    });
});
app.delete("/orders/:id", (req, res) => {
    const orderId = Number(req.params.id);
    const cancelledorder = orderBook.cancelOrder(orderId);

    if (!cancelledorder) {
        return res.status(404).json({
            success: false,
            message: "Order not Found"
        });
    }

    const user = findUserById(cancelledorder.userId);

    if (user && cancelledorder.side === "buy") {
        const refund = cancelledorder.price * cancelledorder.quantity;
        user.lockedBalance -= refund;
        user.balance += refund;
    }

    res.json({
        success: true,
        message: "order cancelled",
        cancelledorder,
        users,
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
// all the fills that are going  on (Trade history)
app.get("/fills", (req, res) => {
    res.json({
        fills: orderBook.fills
    });
});

// fills by the User-specific
app.get("/fills/:userId",(req,res)=>{
  const userId=Number(req.params.userId);
  const fills=orderBook.fills.filter(fill=>
    fill.buyerId === userId || fill.sellerId=== userId
  );
  res.json({
    userId,
    fills
  });
});

// completed orders
app.get("/completed-orders",(req,res)=>{
    res.json({
        completedOrder:orderBook.completedOrders
    });
});

// endpoint to see the all orders
app.get("/orders",(req,res)=>{
    res.json({
        orders:orderBook.allOrders
    });
});

// endpoint to see User-specific orders

app.get("/orders/:userId",(req,res)=>{
    const userId=Number(req.params.userId);
    const orders=orderBook.allOrders.filter(
        order=>order.userId===userId
    )
    res.json({
        orders
    });
});

app.listen(port,()=>{
    console.log(`Backend is Runnig on Port ${port}`);
})