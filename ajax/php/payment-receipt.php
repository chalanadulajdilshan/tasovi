<?php
include '../../class/include.php';
header('Content-Type: application/json');

if ($_POST['action'] === 'get_credit_invoices') {
    $customerId = (int) $_POST['customer_id'];

    $INVOICE = new SalesInvoice(null);
    $data = $INVOICE->getCreditInvoicesByCustomerAndStatus(0, $customerId); // status = 1 (Active)

    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

// Create a new payment receipt
if (isset($_POST['create'])) {



    $RECEIPT = new PaymentReceipt(NULL);

    $RECEIPT->receipt_no   = $_POST['code'];
    $RECEIPT->customer_id  = $_POST['customer_id'];
    $RECEIPT->entry_date   = $_POST['entry_date'];
    $RECEIPT->amount_paid  = $_POST['grandTotal'];
    $RECEIPT->remark       = $_POST['remark'];

    $res = $RECEIPT->create();



    if($res){
        foreach($_POST['invoice_id'] as $index => $invoice_id) {
            // Get the payment amounts for this invoice and ensure they are floats
            $chequePay = isset($_POST['cheque_pay'][$index]) ? floatval(str_replace(',', '', $_POST['cheque_pay'][$index])) : 0.0;
            $cashPay = isset($_POST['cash_pay'][$index]) ? floatval(str_replace(',', '', $_POST['cash_pay'][$index])) : 0.0;
            
            // Only process if at least one payment method has an amount > 0
            if ($chequePay > 0 || $cashPay > 0) {
                $INVOICE = new PaymentReceiptMethod(null);
                $INVOICE->receipt_id = $res;
                $INVOICE->invoice_id = $invoice_id;
                
                // Create separate rows for each payment method
                if ($cashPay > 0) {
                    // Create cash payment row
                    $cashInvoice = new PaymentReceiptMethod(null);
                    $cashInvoice->receipt_id = $res;
                    $cashInvoice->invoice_id = $invoice_id;
                    $cashInvoice->payment_type_id = 1; // 1 for 'cash'
                    $cashInvoice->amount = $cashPay;

                    $cashInvoice->create();
                }
                
                if ($chequePay > 0) {
                    // Create cheque payment row
                    $chequeInvoice = new PaymentReceiptMethod(null);
                    $chequeInvoice->receipt_id = $res;
                    $chequeInvoice->invoice_id = $invoice_id;
                    $chequeInvoice->payment_type_id = 2; // 2 for 'cheque'
                    $chequeInvoice->amount = $chequePay;
                    $chequeInvoice->cheq_no = $_POST['cheque_nos'][$index] ?? '';
                    $chequeInvoice->branch_id = $_POST['bank_branches'][$index] ?? null;
                    $chequeInvoice->cheq_date = $_POST['cheque_dates'][$index] ?? null;
                    $chequeInvoice->create();
                }
            }
        }
    }

    if ($res) {
        echo json_encode(["status" => 'success', "id" => $res]);
    } else {
        echo json_encode(["status" => 'error']);
    }
    exit();
}

// Update payment receipt
if (isset($_POST['update'])) {

    if (!isset($_POST['id'])) {
        echo json_encode(["status" => 'error', "message" => "Missing receipt ID"]);
        exit();
    }

    $RECEIPT = new PaymentReceipt($_POST['id']); // Load receipt by ID

    $RECEIPT->receipt_no   = $_POST['receipt_no'];
    $RECEIPT->customer_id  = $_POST['customer_id'];
    $RECEIPT->entry_date   = $_POST['entry_date'];
    $RECEIPT->amount_paid  = $_POST['amount_paid'];
    $RECEIPT->remark       = $_POST['remark'];

    $res = $RECEIPT->update();

    if ($res) {
        echo json_encode(["status" => 'success']);
    } else {
        echo json_encode(["status" => 'error']);
    }
    exit();
}

// Delete payment receipt
if (isset($_POST['delete']) && isset($_POST['id'])) {
    $RECEIPT = new PaymentReceipt($_POST['id']);
    $res = $RECEIPT->delete();

    if ($res) {
        echo json_encode(["status" => 'success']);
    } else {
        echo json_encode(["status" => 'error']);
    }
    exit();
}
