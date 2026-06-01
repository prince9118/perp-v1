import express from "express";
const app=express();
app.use(express.json());


type Side="buy"|"sell";

interface Order{
    id:number;
    side:Side;
    price:number;
    quantity:number;
}

class OrderBook{
    buyOrder:Order[]=[];
    sellOrder:Order[]=[];

    addOrder(order:Order){
        if(order.side === "buy"){
            this.buyOrder.push(order);
        }else{
            this.sellOrder.push(order);
        }
    }
    getBestBid():Order|undefined{
        if(this.buyOrder.length===0){
            return undefined;
        }
        let bestBid= this.buyOrder[0]!;
        for(let i=0;i<this.buyOrder.length;i++){
            if(this.buyOrder[i]!.price>bestBid.price){
                bestBid=this.buyOrder[i]!;
            }
        }
        return bestBid;
    }
    getBestAsk():Order|undefined{
        if(this.sellOrder.length === 0){
            return undefined;
        }
        let bestAsk=this.sellOrder[0]!;
        for(let i=0;i<this.sellOrder.length;i++){
            if(this.sellOrder[i]!.price<bestAsk.price!){
                bestAsk=this.sellOrder[i]!;
            }
        }
        return bestAsk;
    }
}

const orderBook=new OrderBook();

app.get("/",(req,res)=>{
    res.json({
        message:"server running"
    });
})

// order api to put the data in orderbook
app.post("/orders",(req,res)=>{
    const order=req.body;
    orderBook.addOrder(order);
    res.json({
        success:true,
        message:"Order added",
        order:order
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





app.listen(3000,()=>{
    console.log("Backend is running on port 3000");
})