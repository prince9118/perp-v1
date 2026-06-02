export type Side="buy"|"sell";
export type OrderStatus= "open"|"partial"|"filled"|"cancelled";
export type OrderType="limit"|"market";

export interface BaseOrder{
    id:number;
    userId:number;
    side:Side;
    type:OrderType;
    quantity:number;
    originalQuantity:number;
    status:OrderStatus;
}

export interface LimitOrder extends BaseOrder{
    type:"limit";
    price:number;
}
export interface MarketOrder extends BaseOrder{
    type:"market";

}

export type Order = LimitOrder | MarketOrder;

export interface Fill{
    buyerId:number;
    sellerId:number;
    price:number;
    quantity:number;
}
export interface Users{
    id:number;
    name:string;
    balance:number;
    lockedBalance:number;
}