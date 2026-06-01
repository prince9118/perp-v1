import type {Order,Fill} from "./types";


export class OrderBook{
    buyOrder:Order[]=[];
    sellOrder:Order[]=[];
    fills: Fill[] = [];

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
            const fill={
                buyerId:bestBid.userId,
                sellerId:bestAsk.userId,
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
}