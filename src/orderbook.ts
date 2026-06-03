import type {Order,Fill, LimitOrder, MarketOrder} from "./types";


export class OrderBook{
    buyOrder:LimitOrder[]=[];
    sellOrder:LimitOrder[]=[];
    fills: Fill[] = [];
    completedOrders: Order[] = [];
    allOrders:Order[]=[];

    addOrder(order:LimitOrder){
        this.allOrders.push(order);
        if(order.side === "buy"){
            this.buyOrder.push(order);
        }else{
            this.sellOrder.push(order);
        }
    }
    getBestBid():LimitOrder|undefined{
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
    getBestAsk():LimitOrder|undefined{
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

    canMatch():boolean{
        const bestBid=this.getBestBid();
        const bestAsk=this.getBestAsk();
        if(!bestBid || !bestAsk){
            return false;
        }
        return bestBid.price>=bestAsk.price;
    }

    matchOrders():Fill[]{
        const currentfills:Fill[]=[];
        while(this.canMatch()){
            const bestBid=this.getBestBid()!;
            const bestAsk=this.getBestAsk()!;
            // prevernt from self-trade
            if(bestBid.userId === bestAsk.userId){
                break;
            }
            
            // now lets do trade when i know that the trade can happen 
            const tradeQty=Math.min(bestBid.quantity,bestAsk.quantity);
            bestBid.quantity-=tradeQty;
            bestAsk.quantity-=tradeQty;

            this.updateOrderStatus(bestAsk);
            this.updateOrderStatus(bestBid);
            // storing the completed order
            if(bestBid.status ==="filled"){
                this.completedOrders.push(bestBid);
            }
            if(bestAsk.status==="filled"){
                this.completedOrders.push(bestAsk);
            }

            const fill={
                buyerId:bestBid.userId,
                sellerId:bestAsk.userId,
                buyOrderId:bestBid.id,
                sellOrderId:bestAsk.id,
                price:bestAsk.price,
                quantity:tradeQty,
            }
            currentfills.push(fill);
            this.fills.push(fill);
            // removing the 0 quantity order from orderbook
            this.buyOrder=this.buyOrder.filter(
                order=>order.quantity>0
            );
            this.sellOrder=this.sellOrder.filter(
                order=>order.quantity>0
            );

        }
        
        return currentfills;
    }
    cancelOrder(orderId:number):LimitOrder|null{
        let  order=this.buyOrder.find(order=>order.id===orderId);
        if(!order){
            order=this.sellOrder.find(order=>order.id===orderId);                                          
        }
        if(!order){
            return null;                                          
        }
        // if already filled or cancelled then return null
        if(order.status === "filled"||order.status==="cancelled"){
            return null;
        }
        order.status="cancelled";
        
        this.buyOrder=this.buyOrder.filter(order=>order.id !== orderId);
        this.sellOrder=this.sellOrder.filter(order=>order.id !== orderId);
        return order;
    }
    updateOrderStatus(order: Order) {
        if (order.quantity === 0) {
            order.status = "filled";
        } else if (order.quantity < order.originalQuantity) {
            order.status = "partial";
        } else {
            order.status = "open";
        }
    }
    executeMarketOrder(order:Order):Fill[]{
        if(order.side==="buy"){
            return this.executeMarketOrder(order);
        }else{
            return this.executeMarketOrder(order);
        }
    }
    // market buy
    // market buy consumes from sellOrder

    executeMarketBuy(order:MarketOrder):Fill[]{
        const currentfills:Fill[]=[];
        while(order.quantity>0 && this.sellOrder.length>0){
            const bestAsk=this.getBestAsk()!;
            if(bestAsk.userId===order.userId){
                break;
            }
            const tradeQty=Math.min(order.quantity,bestAsk.quantity);
            order.quantity-=tradeQty;
            bestAsk.quantity-=tradeQty;
            this.updateOrderStatus(order);
            this.updateOrderStatus(bestAsk);
            const fill:Fill={
               buyerId:order.userId,
               sellerId:bestAsk.userId,
               buyOrderId:order.id,
               sellOrderId:bestAsk.id,
               price:bestAsk.price,
               quantity:tradeQty
            }
            this.fills.push(fill);
            if(bestAsk.status==="filled"){
                this.completedOrders.push(bestAsk);
            }
            this.sellOrder=this.sellOrder.filter(order=>order.quantity>0)
        }
        return currentfills;

    }

    //market sell
    executeMarketSell(order:MarketOrder):Fill[]{
        const currentfills:Fill[]=[];
        while(order.quantity>0  && this.buyOrder.length>0){
            const bestBid=this.getBestBid()!;
            if(bestBid.userId===order.userId){
                break;
            }
            const tradeQty=Math.min(order.quantity,bestBid.quantity);
            order.quantity-=tradeQty;
            bestBid.quantity-=tradeQty;
            
            this.updateOrderStatus(order);
            this.updateOrderStatus(bestBid);
            const fill:Fill={
                buyerId:bestBid.userId,
                sellerId:order.userId,
                buyOrderId:bestBid.id,
                sellOrderId:order.id,
                price:bestBid.price,
                quantity:tradeQty
            }
            currentfills.push(fill);
            this.fills.push(fill);
            if(bestBid.status === "filled"){
                this.completedOrders.push(bestBid);
            }
            this.buyOrder=this.buyOrder.filter(order=>order.quantity>0);
        }
        return currentfills;
    }
    
    estimateMarketBuyCost(quantity:number):number{
        let remainingQty=quantity;
        let totalCost=0;
        const sortedAsks=[...this.sellOrder].sort((a,b)=>a.price-b.price);

        for(const ask of sortedAsks){
            if(remainingQty === 0){
                break;
            }
            const tradeQty=Math.min(remainingQty,ask.quantity);
            totalCost+=tradeQty*ask.price;
            remainingQty-=tradeQty;
        }
        return totalCost;
    }  
    // reject orders when liquidity is not enough
    // Do- or -  reject model 
    // check sell  liquidity 

    hasEnoughSellLiquidity(quantity:number):boolean{
        const totalSellQty=this.sellOrder.reduce(
            (total,order)=>total+order.quantity,
            0
        )
    }
   

    
    
    
}