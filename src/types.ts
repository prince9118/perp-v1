export type Side="buy"|"sell";

export interface Order{
    id:number;
    side:Side;
    price:number;
    quantity:number;
}
export interface Fill{
    price:number;
    quantity:number;
}