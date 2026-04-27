export interface OrderDetailProductOption {
  idproductoption: number;
  nameoption: string;
  price: number;
  quantity: number;
  modifiedtotal: boolean;
}

export interface OrderDetailGroup {
  idproductoptiongroup: number;
  nameproductoptiongroup: string;
  orderdetailproductoptions: OrderDetailProductOption[];
}

export function calculateTotal(
  productPrice: number,
  quantity: number,
  groupsdetail: OrderDetailGroup[],
): number {
  let price = productPrice;
  let totaloption = 0;

  for (const detailgroup of groupsdetail) {
    for (const option of detailgroup.orderdetailproductoptions) {
      if (option.price !== 0) {
        if (option.modifiedtotal) {
          price = option.price;
        } else {
          totaloption += option.price * option.quantity;
        }
      }
    }
  }

  return (price + totaloption) * quantity;
}
