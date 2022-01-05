import moment from "moment";
import React from "react";
import { TableCell, TableRow } from "@mui/material";

// moment.locale("en");
moment.locale("th");

type Order = {
  id: number;
  docNoLD: string;
  docNoSD: string;
  type: string;
  status: string;
  noCrate: number;
  quantityTote: number;
  pickUpDate: string;
};
interface Props {
  order: Order;
  index: number;
}

function CheckOrderRow({ order, index }: Props) {
  return (
    <>
      <TableRow>
        <TableCell>{index}</TableCell>
        <TableCell>{order.docNoLD}</TableCell>
        <TableCell>{order.docNoSD}</TableCell>
        <TableCell>{order.type}</TableCell>
        <TableCell>{order.status}</TableCell>
        <TableCell>{order.noCrate}</TableCell>
        <TableCell>{order.quantityTote}</TableCell>
        <TableCell>{order.pickUpDate}</TableCell>
      </TableRow>
    </>
  );
}

export default CheckOrderRow;
