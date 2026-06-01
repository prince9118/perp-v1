export type Side="buy"|"sell";
export type OrderStatus= "open"|"partial"|"filled"|"cancelled";

export interface Order{
    id:number;
    userId:number;
    side:Side;
    price:number;
    quantity:number;// remaining quantity
    originalQuantity:number;// initial quantity
    status:OrderStatus;
}
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