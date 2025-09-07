<?php
include 'class/include.php';
include 'auth.php';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <title>Customer Outstanding Report | <?php echo $COMPANY_PROFILE_DETAILS->name ?> </title>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta content="<?php echo $COMPANY_PROFILE_DETAILS->name ?>" name="author" />
    <!-- include main CSS -->
    <?php include 'main-css.php' ?>
    <link href="assets/libs/datatables.net-bs4/css/dataTables.bootstrap4.min.css" rel="stylesheet" type="text/css">
    <link href="assets/libs/daterangepicker/daterangepicker.css" rel="stylesheet" type="text/css">
    <style>
        /* Target only the Payable Outstanding column in the report table */
        #reportTable thead th.outstanding-column,
        #reportTable tbody td.outstanding-column {
            background-color: #ffebee !important;
        }

        /* Style for total outstanding cell */
        #totalOutstanding {
            background-color: #eb4034 !important;
            color: #ffffff !important;
        }
    </style>
</head>

<body data-layout="horizontal" data-topbar="colored" class="someBlock">

    <!-- Begin page -->
    <div id="layout-wrapper">
        <?php include 'navigation.php'; ?>

        <div class="main-content">
            <div class="page-content">
                <div class="container-fluid">
                    <!-- start page title -->
                    <div class="row">
                        <div class="col-12">
                            <div class="page-title-box d-flex align-items-center justify-content-between">
                                <h4 class="mb-0">Customer Outstanding Report</h4>
                            </div>
                        </div>
                    </div>
                    <!-- end page title -->

                    <div class="row">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <form id="reportForm">
                                        <div class="row mb-3">
                                            <div class="col-md-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="filterType" id="customerView" value="customer" checked>
                                                    <label class="form-check-label" for="customerView">
                                                        Customer View
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" name="filterType" id="dateView" value="date">
                                                    <label class="form-check-label" for="dateView">
                                                        Date View
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Customer Filter -->
                                        <div class="col-md-2">
                                            <label for="customerCode" class="form-label">Customer Code</label>
                                            <div class="input-group mb-3">
                                                <input id="customer_code" name="customer_code" type="text"
                                                    placeholder="Select Customer" class="form-control" readonly>
                                                <input type="hidden" id="customer_id" name="customer_id">
                                                <button class="btn btn-info" type="button" data-bs-toggle="modal"
                                                    data-bs-target="#customerModal">
                                                    <i class="uil uil-search me-1"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <!-- Date Filter -->
                                        <div class="row mt-3" id="dateFilter" style="display: none;">
                                            <div class="col-md-8">
                                                <div class="row">
                                                    <div class="col-md-3">
                                                        <label for="fromDate" class="form-label">From Date <span class="text-danger">*</span></label>
                                                        <div class="input-group" id="datepicker1">
                                                            <input type="text" class="form-control date-picker" id="fromDate" name="fromDate" required>
                                                            <span class="input-group-text"><i class="mdi mdi-calendar"></i></span>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <label for="toDate" class="form-label">To Date <span class="text-danger">*</span></label>
                                                        <div class="input-group" id="datepicker2">
                                                            <input type="text" class="form-control date-picker" id="toDate" name="toDate" required>
                                                            <span class="input-group-text"><i class="mdi mdi-calendar"></i></span>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-2 d-flex align-items-end">
                                                        <button type="button" class="btn btn-sm btn-outline-primary" id="setToday">Today</button>
                                                    </div>
                                                </div>
                                                <small class="text-muted">Select a date range and optionally filter by customer</small>
                                            </div>
                                        </div>

                                        <div class="row">
                                            <div class="col-md-12">
                                                <button type="button" class="btn btn-primary" id="searchBtn">
                                                    <i class="mdi mdi-magnify me-1"></i> Search
                                                </button>
                                                <button type="button" class="btn btn-secondary" id="resetBtn">
                                                    <i class="mdi mdi-refresh me-1"></i> Reset
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Results Table -->
                    <div class="row">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <table id="reportTable" class="table table-bordered dt-responsive nowrap w-100">
                                        <thead>
                                            <tr>
                                                <th>Invoice No</th>
                                                <th>Date</th>
                                                <th>Customer</th>
                                                <th class="text-end">Invoice Amount</th>
                                                <th class="text-end">Paid Amount</th>
                                                <th class="text-end outstanding-column">Payable Outstanding</th>
                                            </tr>
                                        </thead>
                                        <tbody id="reportTableBody">
                                            <!-- Data will be loaded via AJAX -->
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th colspan="3" class="text-end">Total:</th>
                                                <td id="totalInvoice" class="text-danger text-end">0.00</td>
                                                <td id="totalPaid" class="text-danger text-end">0.00</td>
                                                <td id="totalOutstanding" class="text-danger text-end outstanding-column">0.00</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> <!-- container-fluid -->
            </div>
            <!-- End Page-content -->

            <?php include 'footer.php'; ?>
        </div>
        <!-- end main content-->
    </div>
    <!-- END layout-wrapper -->

    <?php include 'customer-master-model.php'; ?>
    <?php include 'main-js.php'; ?>

    <!-- Required datatable js -->
    <script src="assets/libs/datatables.net/js/jquery.dataTables.min.js"></script>
    <script src="assets/libs/datatables.net-bs4/js/dataTables.bootstrap4.min.js"></script>
    <script src="assets/libs/moment/min/moment.min.js"></script>
    <script src="assets/libs/daterangepicker/daterangepicker.min.js"></script>

    <!-- Custom JS for Customer Outstanding Report -->
    <script src="ajax/js/customer-outstanding-report.js"></script>

    <script>
        $(document).ready(function() {
            // Initialize the datepicker
            $(".date-picker").datepicker({
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true,
                yearRange: '1900:2099',
                showButtonPanel: true
            });

            // Set today's date when clicking the Today button
            $('#setToday').click(function() {
                const today = new Date();
                const todayFormatted = $.datepicker.formatDate('yy-mm-dd', today);
                $('.date-picker').val(todayFormatted);
            });

            // Handle customer selection from modal
            $(document).on('click', '.select-customer', function(e) {
                e.preventDefault();
                const customerId = $(this).data('id');
                const customerCode = $(this).data('code');
                const customerType = $('.modal.show').find('[data-customer-type]').data('customer-type');

                if (customerType === 'date') {
                    $('#date_customer_id').val(customerId);
                    $('#date_customer_code').val(customerCode);
                } else {
                    $('#customer_id').val(customerId);
                    $('#customer_code').val(customerCode);
                }
                $('#customerModal').modal('hide');
            });

            // Toggle between customer and date views
            $('input[name="filterType"]').change(function() {
                const selectedValue = $(this).val();
                if (selectedValue === 'date') {
                    $('#customer_code').closest('.col-md-2').hide();
                    $('#dateFilter').show();
                    // Set default dates
                    const today = new Date();
                    $('#toDate').datepicker('setDate', today);
                    // Set from date to first day of current month
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    $('#fromDate').datepicker('setDate', firstDay);
                    // Clear any previous customer selection
                    $('#date_customer_id').val('');
                    $('#date_customer_code').val('');
                } else {
                    $('#customer_code').closest('.col-md-2').show();
                    $('#dateFilter').hide();
                    // Clear date filter values
                    $('#fromDate').val('');
                    $('#toDate').val('');
                }
            });

            // Set to today's date
            $('#setToday').click(function(e) {
                e.preventDefault();
                const today = new Date();
                $('#toDate').datepicker('setDate', today);
                // Set from date to first day of current month
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                $('#fromDate').datepicker('setDate', firstDay);
            });

            // Validate date range
            $('#fromDate, #toDate').change(function() {
                const fromDate = new Date($('#fromDate').datepicker('getDate'));
                const toDate = new Date($('#toDate').datepicker('getDate'));

                if (fromDate > toDate) {
                    alert('From date cannot be after To date');
                    $(this).datepicker('setDate', null);
                }
            });
        });
    </script>

</body>

</html>