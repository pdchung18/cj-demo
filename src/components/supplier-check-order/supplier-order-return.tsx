import React, { useMemo } from 'react';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogContentText,
  Grid,
  Link,
  TextField,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import Box from '@mui/system/Box';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { BootstrapDialogTitle } from '../commons/ui/dialog-title';
import Steppers from '../commons/ui/steppers';

import theme from '../../styles/theme';
import { useStyles } from '../../styles/makeTheme';
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridColumnHeaderParams,
  GridRenderCellParams,
  GridRowData,
  GridRowId,
  useGridApiRef,
} from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../../store/store';
// import { PurchaseDetailEntries, PurchaseDetailInfo } from '../../models/supplier-check-order-model';
import AlertError from '../commons/ui/alert-error';
import { ErrorOutline } from '@mui/icons-material';
import SnackbarStatus from '../commons/ui/snackbar-status';
import ConfirmModalExit from '../commons/ui/confirm-exit-model';
import LoadingModal from '../commons/ui/loading-modal';
import { approvePurchaseCreditNote, draftPurchaseCreditNote, getPathReportPI } from '../../services/purchase';
import {
  ItemsType,
  PurchaseCreditNoteType,
  PurchaseNoteDetailEntries,
  PurchaseNoteResponseType,
} from '../../models/purchase-credit-note';
import { ApiError } from '../../models/api-error-model';
import { featchSupplierOrderDetailAsync } from '../../store/slices/supplier-order-detail-slice';
import ModalConfirmOrderReturn from './modal-confirm-order-return';
import { featchOrderListSupAsync } from '../../store/slices/supplier-check-order-slice';
import { isValid } from 'date-fns';
import AccordionHuaweiFile from './accordion-huawei-file';
import { FileType } from '../../models/supplier-check-order-model';
import { featchPurchaseNoteAsync } from '../../store/slices/supplier-order-return-slice';
import AccordionUploadFile from './accordion-upload-file';
import { formatFileNam } from '../../utils/enum/check-order-enum';
import ModalShowFile from '../commons/ui/modal-show-file';
interface Props {
  isOpen: boolean;
  onClickClose: () => void;
}

const columns: GridColDef[] = [
  {
    field: 'index',
    headerName: 'ลำดับ',
    flex: 0.5,
    width: 30,
    headerAlign: 'center',
    sortable: false,
    // hide: true,
    renderCell: (params) => (
      <Box component='div' sx={{ paddingLeft: '20px' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'barcode',
    headerName: 'บาร์โค้ด',
    width: 200,
    flex: 0.7,
    headerAlign: 'center',
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'productName',
    headerName: 'รายละเอียดสินค้า',
    headerAlign: 'center',
    minWidth: 220,
    flex: 1,
    sortable: false,
    renderCell: (params) => (
      <div>
        <Typography variant='body2'>{params.value}</Typography>
        <Typography color='textSecondary' sx={{ fontSize: 12 }}>
          {params.getValue(params.id, 'skuCode') || ''}
        </Typography>
      </div>
    ),
  },
  {
    field: 'actualQty',
    headerName: 'จำนวนที่รับ',
    width: 150,
    headerAlign: 'center',
    align: 'right',
    sortable: false,
  },
  {
    field: 'returnQty',
    headerName: 'จำนวนที่คืน',
    width: 150,
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams) => (
      <div>
        <TextField
          variant='outlined'
          name='txnQtyReturn'
          type='number'
          inputProps={{ style: { textAlign: 'right' } }}
          value={params.value}
          onChange={(e) => {
            var qty: any =
              params.getValue(params.id, 'actualQty') &&
              params.getValue(params.id, 'actualQty') !== null &&
              params.getValue(params.id, 'actualQty') != undefined
                ? params.getValue(params.id, 'actualQty')
                : 0;
            var value = e.target.value ? parseInt(e.target.value, 10) : '0';
            // if (value > qty) value = qty;
            params.api.updateRows([{ ...params.row, returnQty: value }]);
          }}
          disabled={params.getValue(params.id, 'isDraftStatus') ? true : false}
          autoComplete='off'
        />
      </div>
    ),
  },
  {
    field: 'unitName',
    headerName: 'หน่วย',
    width: 110,
    headerAlign: 'center',
    sortable: false,
  },
];
function useApiRef() {
  const apiRef = useGridApiRef();
  const _columns = useMemo(
    () =>
      columns.concat({
        field: '',
        width: 0,
        sortable: false,
        renderCell: (params) => {
          apiRef.current = params.api;
          return null;
        },
      }),
    [columns]
  );

  return { apiRef, columns: _columns };
}

function SupplierOrderReturn({ isOpen, onClickClose }: Props) {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const purchaseDetailList = useAppSelector((state) => state.SupplierOrderReturn.purchaseDetail);
  const payloadSearch = useAppSelector((state) => state.saveSearchOrderSup.searchCriteria);

  const purchaseDetail: any = purchaseDetailList.data ? purchaseDetailList.data : null;
  const [purchaseDetailItems, setPurchaseDetailItems] = React.useState<PurchaseNoteDetailEntries[]>(
    purchaseDetail.entries ? purchaseDetail.entries : []
  );

  const [files, setFiles] = React.useState<FileType[]>([]);
  const fileUploadList = useAppSelector((state) => state.uploadFileSlice.state);
  const { apiRef, columns } = useApiRef();

  const [openAlert, setOpenAlert] = React.useState(false);
  const [textError, setTextError] = React.useState('');
  const [showSnackBar, setShowSnackBar] = React.useState(false);
  const [contentMsg, setContentMsg] = React.useState('');
  const [snackbarIsStatus, setSnackbarIsStatus] = React.useState(false);
  const [openModelConfirm, setOpenModelConfirm] = React.useState(false);

  const [confirmModelExit, setConfirmModelExit] = React.useState(false);

  const [openLoadingModal, setOpenLoadingModal] = React.useState(false);

  const [pageSize, setPageSize] = React.useState<number>(10);
  const [open, setOpen] = React.useState(isOpen);
  const [pnStatus, setPnStatus] = React.useState(0);
  const [pnNo, setPnNo] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [characterCount, setCharacterCount] = React.useState(0);
  const maxCommentLength = 255;
  const handleChangeComment = (event: any) => {
    const value = event.target.value;
    const length = event.target.value.length;
    if (length <= maxCommentLength) {
      setCharacterCount(event.target.value.length);
      setComment(value);
    }
  };
  const [cols, setCols] = React.useState(columns);

  React.useEffect(() => {
    setFiles(purchaseDetail.files ? purchaseDetail.files : []);
    setComment(purchaseDetail.comment);
    setPnStatus(purchaseDetail.pnState);
    setPnNo(purchaseDetail.pnNo);
    let newColumns = [...cols];
    if (purchaseDetail.pnState == 1) {
      newColumns[0]['hide'] = false;
    } else {
      newColumns[0]['hide'] = true;
    }
    setCols(newColumns);
  }, [open]);

  let rows = purchaseDetailItems
    // .filter((item: PurchaseDetailEntries) => item.pnDisplay === 1)
    .map((item: PurchaseNoteDetailEntries, index: number) => {
      return {
        id: `${item.barcode}-${index + 1}`,
        index: index + 1,
        seqItem: item.seqItem,
        produtStatus: item.produtStatus,
        isDraftStatus: pnStatus === 0 ? false : true,
        skuCode: item.skuCode,
        barcode: item.barcode,
        productName: item.productName,
        qty: item.qty,
        qtyAll: item.qtyAll,
        unitName: item.unitName,
        unitCode: item.unitCode,
        actualQty: item.actualQty,
        returnQty: item.returnQty ? item.returnQty : 0,
        actualQtyAll: item.actualQtyAll,
      };
    });

  const handleClose = async () => {
    await storeItem();
    let isExit = true;
    // onClickClose();
    if (comment !== purchaseDetail.comment) {
      isExit = false;
    }
    const rowSelect = apiRef.current.getSelectedRows();
    if (rowSelect.size > 0) {
      isExit = false;
    }
    const ent: PurchaseNoteDetailEntries[] = purchaseDetail.entries;
    const rowsEdit: Map<GridRowId, GridRowData> = apiRef.current.getRowModels();
    if (rowsEdit.size !== ent.length) {
      isExit = false;
    }

    let i = 0;
    rowsEdit.forEach((data: GridRowData) => {
      if (data.returnQty !== (ent[i].returnQty ? ent[i].returnQty : 0)) {
        isExit = false;
      }
      i++;
    });

    if (!isExit) {
      setConfirmModelExit(true);
    } else {
      setOpen(false);
      onClickClose();
    }
  };

  const handleCloseAlert = () => {
    setOpenAlert(false);
  };

  const validateItem = () => {
    const rowsEdit: Map<GridRowId, GridRowData> = apiRef.current.getRowModels();
    let itemNotValid: boolean = false;
    rowsEdit.forEach((data: GridRowData) => {
      if (data.returnQty > data.actualQty || data.returnQty <= 0) {
        itemNotValid = true;
        return;
      }
    });
    if (itemNotValid) {
      setOpenAlert(true);
      setTextError('จำนวนที่คืนต้องมากกว่า 0 หรือ น้อยกว่า จำนวนที่รับ');
      return false;
    } else {
      return true;
    }
  };

  const storeItem = () => {
    const rowsEdit: Map<GridRowId, GridRowData> = apiRef.current.getRowModels();
    const items: PurchaseNoteDetailEntries[] = [];
    rowsEdit.forEach((data: GridRowData) => {
      const newData: PurchaseNoteDetailEntries = {
        seqItem: data.seqItem,
        produtStatus: data.produtStatus,
        isDraftStatus: pnStatus === 0 ? false : true,
        skuCode: data.skuCode,
        barcode: data.barcode,
        productName: data.productName,
        qty: data.qty,
        qtyAll: data.qtyAll,
        actualQty: data.actualQty,
        returnQty: data.returnQty,
        actualQtyAll: data.actualQtyAll,
        unitName: data.unitName,
        unitCode: data.unitCode,
      };
      items.push(newData);
    });
    setPurchaseDetailItems(items);
  };

  const handleSaveBtn = async () => {
    await storeItem();
    const rs = validateItem();
    // call api
    if (rs) {
      setOpenLoadingModal(true);
      const payload = await mappingPayload();
      await draftPurchaseCreditNote(payload, purchaseDetail.piNo, fileUploadList)
        .then((value) => {
          setPnNo(value.pnNo);
          setShowSnackBar(true);
          setSnackbarIsStatus(true);
          setContentMsg('คุณได้บันทึกข้อมูลเรียบร้อยแล้ว');
          dispatch(featchPurchaseNoteAsync(purchaseDetail.piNo));
          dispatch(featchOrderListSupAsync(payloadSearch));
        })
        .catch((error: ApiError) => {
          setShowSnackBar(true);
          setContentMsg(error.message);
        });

      setOpenLoadingModal(false);
    }
  };

  const mappingPayload = () => {
    let items: ItemsType[] = [];
    const rowsEdit: Map<GridRowId, GridRowData> = apiRef.current.getRowModels();
    rowsEdit.forEach((data: GridRowData) => {
      const item: ItemsType = {
        barcode: data.barcode,
        qtyReturn: data.returnQty ? data.returnQty : 0,
      };
      items.push(item);
    });

    const payload: PurchaseCreditNoteType = {
      comment: comment,
      items: items,
    };
    return payload;
  };

  const handleDeleteBtn = () => {
    const rowsEdit: Map<GridRowId, GridRowData> = apiRef.current.getRowModels();
    const rowSelect = apiRef.current.getSelectedRows();
    if (rowSelect.size === rowsEdit.size) {
      setOpenAlert(true);
      setTextError('ไม่สามารถลบรายการทั้งหมดได้');
      return;
    }
    rowSelect.forEach((data: GridRowData, key) => {
      rowsEdit.delete(key);
    });

    const items: PurchaseNoteDetailEntries[] = [];
    rowsEdit.forEach((data: GridRowData) => {
      const newData: PurchaseNoteDetailEntries = {
        seqItem: data.seqItem,
        produtStatus: data.produtStatus,
        isDraftStatus: pnStatus === 0 ? false : true,
        skuCode: data.skuCode,
        barcode: data.barcode,
        productName: data.productName,
        qty: data.qty,
        qtyAll: data.qtyAll,
        unitName: data.unitName,
        unitCode: data.unitCode,
        actualQty: data.actualQty,
        returnQty: data.returnQty,
        actualQtyAll: data.actualQtyAll,
      };
      items.push(newData);
    });
    setPurchaseDetailItems([]);
    setPurchaseDetailItems(items);
  };
  const handleCloseSnackBar = () => {
    setShowSnackBar(false);
  };

  function handleNotExitModelConfirm() {
    setConfirmModelExit(false);
  }

  function handleExitModelConfirm() {
    setConfirmModelExit(false);
    setOpen(false);
    onClickClose();
  }
  const handleOnCloseModalConfirm = () => {
    setOpenModelConfirm(false);
  };

  const handleConfirmBtn = async () => {
    await storeItem();
    const isFileValidate: boolean = validateFileInfo();
    const rs = validateItem();
    let isCallSaveDraft: boolean = true;
    if (rs && isFileValidate) {
      if (!pnNo) {
        const payload = mappingPayload();
        await draftPurchaseCreditNote(payload, purchaseDetail.piNo, fileUploadList)
          .then((value: PurchaseNoteResponseType) => {
            setPnNo(value.pnNo);
          })
          .catch((error: ApiError) => {
            setShowSnackBar(true);
            setContentMsg(error.message);
            isCallSaveDraft = false;
          });
      }
      if (isCallSaveDraft) {
        setOpenModelConfirm(true);
      }
    }
  };

  const validateFileInfo = () => {
    const isvalid = fileUploadList.length > 0 ? true : false;
    const isExistingFile = files.length > 0 ? true : false;
    if (!(isvalid || isExistingFile)) {
      setOpenAlert(true);
      setTextError('กรุณาแนบเอกสาร');
      return false;
    }
    return true;
  };

  const approvePN = async () => {
    setOpenLoadingModal(true);
    let items: ItemsType[] = [];
    purchaseDetailItems.forEach((data: PurchaseNoteDetailEntries) => {
      const item: ItemsType = {
        barcode: data.barcode,
        qtyReturn: data.returnQty ? data.returnQty : 0,
      };
      items.push(item);
    });

    const payload: PurchaseCreditNoteType = {
      pnNo: pnNo,
      comment: comment,
      items: items,
    };
    await approvePurchaseCreditNote(payload, fileUploadList)
      .then((_value) => {
        handleOnCloseModalConfirm();
        setShowSnackBar(true);
        setSnackbarIsStatus(true);
        setContentMsg('คุณได้อนุมัติข้อมูล เรียบร้อยแล้ว');
        dispatch(featchOrderListSupAsync(payloadSearch));
        setTimeout(() => {
          setOpen(false);
          onClickClose();
        }, 500);
      })
      .catch((error: ApiError) => {
        handleOnCloseModalConfirm();
        setShowSnackBar(true);
        setContentMsg(error.message);
      });
    handleOnCloseModalConfirm();
    setOpenLoadingModal(false);
  };

  const [openModelPreviewDocument, setOpenModelPreviewDocument] = React.useState(false);
  const [statusFile, setStatusFile] = React.useState(0);
  function handleModelPreviewDocument() {
    setOpenModelPreviewDocument(false);
  }
  const handleLinkDocument = async () => {
    setOpenLoadingModal(true);
    setStatusFile(1);
    setOpenModelPreviewDocument(true);
    setOpenLoadingModal(false);
  };

  const currentlySelected = async (params: GridCellParams) => {
    storeItem();
  };

  return (
    <div>
      {' '}
      <Dialog open={open} maxWidth='xl' fullWidth={true}>
        <BootstrapDialogTitle id='customized-dialog-title' onClose={handleClose}>
          <Typography sx={{ fontSize: '1em' }}>ใบคืนสินค้า</Typography>
          <Steppers status={pnStatus}></Steppers>
        </BootstrapDialogTitle>
        <DialogContent>
          <Box mt={4} sx={{ flexGrow: 1 }}>
            <Grid container spacing={2} mb={1}>
              <Grid item lg={2}>
                <Typography variant='body2'>เลขที่เอกสาร PN</Typography>
              </Grid>
              <Grid item lg={4}>
                <Typography variant='body2'>{pnNo}</Typography>
              </Grid>
              <Grid item lg={2}>
                <Typography variant='body2'>ผู้จำหน่าย</Typography>
              </Grid>
              <Grid item lg={4}>
                <div
                  style={{
                    border: '1px solid #CBD4DB',
                    borderRadius: 5,
                    maxWidth: 250,
                    background: '#EAEBEB',
                    padding: 2,
                  }}>
                  <Typography variant='body2' sx={{ color: '#263238' }}>
                    {purchaseDetail.supplierName}
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#AEAEAE', fontSize: 12 }}>
                    {purchaseDetail.supplierTaxNo}
                  </Typography>
                </div>
              </Grid>
            </Grid>
            <Grid container spacing={2} mb={1}>
              <Grid item lg={2}>
                <Typography variant='body2'>เลขที่เอกสาร PI :</Typography>
              </Grid>
              <Grid item lg={4}>
                <Typography variant='body2'>{purchaseDetail.piNo}</Typography>
              </Grid>
              <Grid item lg={2}>
                <Typography variant='body2'>แนบเอกสารจากผู้จำหน่าย :</Typography>
              </Grid>
              <Grid item lg={4}>
                {pnStatus === 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
                    <Button
                      id='btnPrint'
                      color='primary'
                      variant='contained'
                      component='span'
                      className={classes.MbtnBrowse}
                      disabled>
                      แนบไฟล์
                    </Button>

                    <Typography
                      variant='overline'
                      sx={{ ml: 1, color: theme.palette.cancelColor.main, lineHeight: '120%' }}>
                      แนบไฟล์ .pdf/.jpg ขนาดไม่เกิน 5 mb
                    </Typography>
                  </Box>
                )}
                {pnStatus === 1 && files.length > 0 && <AccordionHuaweiFile files={files} />}
                {pnStatus === 1 && (
                  <Link component='button' variant='body2' onClick={handleLinkDocument}>
                    เรียกดูเอกสารใบคืนสินค้า
                  </Link>
                )}
                {pnStatus === 0 && <AccordionUploadFile files={files} />}
              </Grid>
            </Grid>
          </Box>
          {pnStatus === 0 && (
            <Grid
              item
              container
              xs={12}
              sx={{ mt: 3 }}
              justifyContent='space-between'
              direction='row'
              alignItems='flex-end'>
              <Grid item xl={2}>
                <Button
                  id='btnSave'
                  variant='contained'
                  color='secondary'
                  className={classes.MbtnSave}
                  onClick={handleDeleteBtn}
                  startIcon={<DeleteIcon />}
                  sx={{ width: 200 }}>
                  ลบรายการ
                </Button>
              </Grid>
              <Grid item>
                <Button
                  id='btnSave'
                  variant='contained'
                  color='warning'
                  className={classes.MbtnSave}
                  onClick={handleSaveBtn}
                  startIcon={<SaveIcon />}
                  sx={{ width: 200 }}>
                  บันทึก
                </Button>

                <Button
                  id='btnApprove'
                  variant='contained'
                  color='primary'
                  className={classes.MbtnApprove}
                  onClick={handleConfirmBtn}
                  startIcon={<CheckCircleOutline />}
                  sx={{ width: 200 }}>
                  ยืนยัน
                </Button>
              </Grid>
            </Grid>
          )}
          <Box mt={2} bgcolor='background.paper'>
            <div
              style={{ width: '100%', height: rows.length >= 8 ? '70vh' : 'auto' }}
              className={classes.MdataGridDetail}>
              <DataGrid
                rows={rows}
                columns={cols}
                checkboxSelection={pnStatus === 0 ? true : false}
                disableSelectionOnClick
                pageSize={pageSize}
                onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                rowsPerPageOptions={[10, 20, 50, 100]}
                pagination
                disableColumnMenu
                autoHeight={rows.length >= 8 ? false : true}
                scrollbarSize={10}
                rowHeight={65}
                onCellClick={currentlySelected}
              />
            </div>
          </Box>
          <Box mt={3}>
            <Grid container spacing={2} mb={1}>
              <Grid item lg={4}>
                <Typography variant='body2'>หมายเหตุ:</Typography>
                <TextField
                  multiline
                  fullWidth
                  rows={5}
                  onChange={handleChangeComment}
                  defaultValue={comment}
                  placeholder='ความยาวไม่เกิน 255 ตัวอักษร'
                  className={classes.MtextFieldRemark}
                  inputProps={{ maxLength: maxCommentLength }}
                  sx={{ maxWidth: 350 }}
                  disabled={pnStatus !== 0}
                />

                <div
                  style={{
                    fontSize: '11px',
                    color: '#AEAEAE',
                    width: '100%',
                    maxWidth: 350,
                    textAlign: 'right',
                    // marginTop: "-1.5em",
                  }}>
                  {characterCount}/{maxCommentLength}
                </div>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
      <AlertError open={openAlert} onClose={handleCloseAlert} textError={textError} />
      <SnackbarStatus
        open={showSnackBar}
        onClose={handleCloseSnackBar}
        isSuccess={snackbarIsStatus}
        contentMsg={contentMsg}
      />
      <ConfirmModalExit
        open={confirmModelExit}
        onClose={handleNotExitModelConfirm}
        onConfirm={handleExitModelConfirm}
      />
      <ModalConfirmOrderReturn
        open={openModelConfirm}
        onClose={handleOnCloseModalConfirm}
        handleConfirm={approvePN}
        header='ยืนยันอนุมัติใบคืนสินค้า'
        title='เลขที่เอกสาร PN'
        value={pnNo}
      />
      <ModalShowFile
        open={openModelPreviewDocument}
        onClose={handleModelPreviewDocument}
        url={getPathReportPI(purchaseDetail.piNo)}
        statusFile={statusFile}
        sdImageFile=''
        fileName={formatFileNam(pnNo, pnStatus)}
        btnPrintName='พิมพ์เอกสาร'
      />
      <LoadingModal open={openLoadingModal} />
    </div>
  );
}

export default SupplierOrderReturn;
