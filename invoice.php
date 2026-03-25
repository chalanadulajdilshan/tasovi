<!doctype html>
<?php
include 'class/include.php';

if (!isset($_SESSION)) {
    session_start();
}

$invoice_id = $_GET['invoice_no'];
$US = new User($_SESSION['id']);
$COMPANY_PROFILE = new CompanyProfile($US->company_id);
$SALES_INVOICE = new SalesInvoice($invoice_id);
$CUSTOMER_MASTER = new CustomerMaster($SALES_INVOICE->customer_id);
?>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <title>Invoice Details </title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php include 'main-css.php' ?>
    <link href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" rel="stylesheet">

    <style>
        @media print {

            /* Hide non-print elements */
            .no-print {
                display: none !important;
            }

            /* Make invoice full width */
            body,
            html {
                width: 100%;
                margin: 0;
                padding: 0;
                font-size: 13px !important;
            }

            #invoice-content,
            .card {
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            .container {
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            /* Set A5 page size */
            @page {
                size: A5 portrait;
                margin: 5mm;
            }

            /* Reduce spacing for items */
            .invoice-title .row {
                margin-bottom: 10px !important;
            }

            .table {
                margin-bottom: 10px !important;
            }

            /* Ensure signatures stay on the same page */
            tr {
                page-break-inside: avoid;
            }
        }

        /* Remove padding and spacing in invoice table */
        #invoice-content table,
        #invoice-content th,
        #invoice-content td {
            padding: 4px !important;
            margin: 0 !important;
            border-spacing: 0 !important;
            border-collapse: collapse !important;
        }

        #invoice-content th,
        #invoice-content td {
            vertical-align: middle !important;
        }

        #invoice-content .table {
            width: 100%;
            border-top-width: 0 !important;
            border-style: none !important;
        }

        .company-logo {
            max-height: 80px;
            width: auto;
            object-fit: contain;
        }
    </style>

</head

    <body data-layout="horizontal" data-topbar="colored">

<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-3 no-print">
        <h4>Invoice</h4>
        <div>
            <button onclick="window.print()" class="btn btn-success ms-2">Print</button>
            <button onclick="downloadPDF()" class="btn btn-primary ms-2">PDF</button>
        </div>
    </div>

    <div class="card" id="invoice-content">
        <div class="card-body">
            <!-- Company & Customer Info -->
            <div class="invoice-title">
                <div class="row mb-4">
                    <?php
                    function formatPhone($number)
                    {
                        $number = preg_replace('/\D/', '', $number);
                        if (strlen($number) == 10) {
                            return sprintf("(%s) %s-%s", substr($number, 0, 3), substr($number, 3, 3), substr($number, 6));
                        }
                        return $number;
                    }
                    ?>
                    <div class="col-md-6 d-flex align-items-start">
                        <?php 
                        $logo_path = './uploads/company-logos/' . $COMPANY_PROFILE->image_name;
                        if (!empty($COMPANY_PROFILE->image_name) && file_exists(__DIR__ . '/uploads/company-logos/' . $COMPANY_PROFILE->image_name)) { ?>
                            <img src="<?php echo $logo_path; ?>" class="company-logo me-3" alt="logo">
                        <?php } ?>
                        <div class="text-muted">
                            <p class="mb-0" style="font-weight:bold;font-size:15px;"><?php echo str_replace('Â', '', $COMPANY_PROFILE->name) ?></p>
                            <p class="mb-0" style="font-size:11px;"><?php echo $COMPANY_PROFILE->address ?></p>
                            <p class="mb-0" style="font-size:11px;"><?php echo $COMPANY_PROFILE->email ?></p>
                            <p class="mb-0" style="font-size:11px;"><?php echo formatPhone($COMPANY_PROFILE->mobile_number_1); ?></p>
                        </div>
                    </div>
                    <div class="col-md-6 text-start">
                        <h4 style="font-weight:bold;font-size:15px; margin-bottom:5px;">
                            <?php echo ($SALES_INVOICE->payment_type == 1) ? "CASH SALES INVOICE" : "CREDIT SALES INVOICE"; ?>
                        </h4>
                        <div style="font-size:11px; line-height:1.2;">
                            <p class="mb-0 text-muted"><strong>Customer:</strong> <?php echo $SALES_INVOICE->customer_name ?></p>
                            <p class="mb-0 text-muted"><strong>Contact:</strong> <?php echo !empty($SALES_INVOICE->customer_mobile) ? $SALES_INVOICE->customer_mobile : '.................................' ?></p>
                            <p class="mb-0 text-muted"><strong>VAT No:</strong> <?php echo !empty($COMPANY_PROFILE->vat_number) ? $COMPANY_PROFILE->vat_number : '.................................' ?></p>
                            <p class="mb-0 text-muted"><strong>Inv No:</strong> <?php echo $SALES_INVOICE->invoice_no ?></p>
                            <p class="mb-0 text-muted"><strong>Inv Date:</strong> <?php echo date('d M, Y', strtotime($SALES_INVOICE->invoice_date)); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ITEM INVOICE PRINT -->
            <?php if ($SALES_INVOICE->invoice_type == 'INV') { ?>
                <div class="table-responsive" style="overflow-x: hidden !important;">
                    <table class="table table-centered mb-0" style="width: 100%; table-layout: fixed;">
                        <thead>
                            <tr style="font-size: 11px;">
                                <th style="width: 30px;">No.</th>
                                <th>Item</th>
                                <th style="width: 70px;" class="text-end">List Price</th>
                                <th style="width: 45px;" class="text-end">Dis %</th>
                                <th style="width: 70px;" class="text-end">Selling Price</th>
                                <th style="width: 35px;" class="text-end">Qty</th>
                                <th style="width: 80px;" class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody style="font-size:11px;" class="font-bold">
                            <?php
                            $TEMP_SALES_ITEM = new SalesInvoiceItem(null);
                            $temp_items_list = $TEMP_SALES_ITEM->getItemsByInvoiceId($invoice_id);
                            $subtotal = 0;
                            $total_discount = 0;

                            foreach ($temp_items_list as $key => $temp_items) {
                                $key++;
                                $price = (float) $temp_items['price'];
                                $quantity = (int) $temp_items['quantity'];
                                $discount_percentage = isset($temp_items['discount']) ? (float) $temp_items['discount'] : 0;
                                $discount_per_item = $price * ($discount_percentage / 100);
                                $selling_price = $price - $discount_per_item;
                                $line_total = $price * $quantity;
                                $subtotal += $price * $quantity;
                                $total_discount += $discount_per_item * $quantity;
                                $ITEM_MASTER = new ItemMaster($temp_items['item_code']);
                            ?>
                                <tr>
                                    <td>0<?php echo $key; ?></td>
                                    <td style="word-break: break-all;"><?php echo $ITEM_MASTER->code . ' ' . $temp_items['item_name']; ?></td>
                                    <td class="text-end"><?php echo number_format($price, 2); ?></td>
                                    <td class="text-end"><?php echo $discount_percentage; ?>%</td>
                                    <td class="text-end"><?php echo number_format($selling_price, 2); ?></td>
                                    <td class="text-end"><?php echo $quantity; ?></td>
                                    <td class="text-end"><?php echo number_format($line_total, 2); ?></td>
                                </tr>
                            <?php } ?>
                            <tr>
                                <td colspan="4" rowspan="3" style="vertical-align:top;  ">
                                    <h6 style="margin-top:8px;"><strong>Terms & Conditions:</strong></h6>
                                    <ul style="padding-left:20px;margin-bottom:0;">
                                        <?php
                                        $invoiceRemark = new InvoiceRemark();
                                        $paymentRemarks = $invoiceRemark->getRemarkByPaymentType($SALES_INVOICE->payment_type);
                                        if (!empty($paymentRemarks)) {
                                            foreach ($paymentRemarks as $remark) {
                                                if (!empty($remark['remark'])) {
                                                    echo '<li>' . htmlspecialchars($remark['remark']) . '</li>';
                                                }
                                            }
                                        }
                                        ?>
                                    </ul>
                                </td>
                                <td colspan="2" class="text-end">Gross Amount:-</td>
                                <td class="text-end"><?php echo number_format($subtotal, 2); ?></td>
                            </tr>
                            <tr>
                                <td colspan="2" class="text-end">Discount:-</td>
                                <td class="text-end">- <?php echo number_format($total_discount, 2); ?></td>
                            </tr>
                            <tr>
                                <td colspan="2" class="text-end"><strong>Net Amount:-</strong></td>
                                <td class="text-end"><strong><?php echo number_format($subtotal - $total_discount, 2); ?></strong></td>
                            </tr>
                            <tr>
                                <td colspan="7" style="padding-top:20px;">
                                    <table style="width:100%;">
                                        <tr>
                                            <td style="text-align:center;">_________________________<br><strong>Prepared By</strong></td>
                                            <td style="text-align:center;">_________________________<br><strong>Approved By</strong></td>
                                            <td style="text-align:center;">_________________________<br><strong>Received By</strong></td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            <?php } ?>

        </div>
    </div>
</div>

<!-- JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
    function downloadPDF() {
        const element = document.getElementById('invoice-content');
        const opt = {
            margin: 0.5,
            filename: 'Invoice_<?php echo $SALES_INVOICE->invoice_no ?>.pdf',
            image: {
                type: 'jpeg',
                quality: 0.98
            },
            html2canvas: {
                scale: 2
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };
        html2pdf().set(opt).from(element).save();
    }

    // Trigger print on Enter
    document.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            window.print();
        }
    });
</script>
<script src="assets/js/bootstrap.bundle.min.js"></script>
</body>

</html>