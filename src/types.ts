export type Side="buy"|"sell";

export interface Order{
    id:number;
    userId:number;
    side:Side;
    price:number;
    quantity:number;
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