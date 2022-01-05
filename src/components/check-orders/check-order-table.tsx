import moment from "moment";
import React from "react";
import { useStyles } from "../../styles/makeTheme";
import { check_orders } from "../../mockdata/check-orders";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import CheckOrderRow from "./check-order-row";

// moment.locale("en");
moment.locale("th");

function CheckOrderTable() {
  const heads = [
    "ลำดับ",
    "เลขที่เอกสาร LD",
    "เลขที่เอกสาร SD",
    "ประเภท",
    "สถานะ",
    "จำนวนลัง",
    "จำนวน Tote",
    "วันที่รับสินค้า",
  ];

  const classes = useStyles();
  const { data, total } = check_orders;

  const [page, setPage] = React.useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={data.length}
        rowsPerPage={10}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {heads.map((column, index) => (
                <TableCell
                  sx={{ color: "#36C690", fontWeight: "bold" }}
                  key={index}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return <CheckOrderRow order={row} index={index} key={row.id} />;
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default CheckOrderTable;
