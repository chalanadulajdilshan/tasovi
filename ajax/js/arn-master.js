jQuery(document).ready(function () {

    // Item Table check

    $('#brand, #category').change(function () {
        table.ajax.reload();
        // Enable/disable item_search button based on brand selection
        if ($('#brand').val() !== '') {
            $('#item_search').prop('disabled', false);
        } else {
            $('#item_search').prop('disabled', true);
        }
    });

    var table = $('#datatable').DataTable({

        processing: true,
        serverSide: true,

        ajax: {
            url: "ajax/php/item-master.php",
            type: "POST",
            data: function (d) {

                var brandId = $('#brand').val();
                var categoryId = $('#category').val();
               
                d.filter = true;
                d.brand_id = brandId;
                d.category_id = categoryId;
                d.status = 0;
                d.stock_only = 0;
            },
            dataSrc: function (json) {

                return json.data;
            },
            error: function (xhr) {
                console.error("Server Error Response:", xhr.responseText);
            }
        },
        columns: [

            { data: "key", title: "#ID" },
            { data: "code", title: "Code" },
            { data: "name", title: "Name" },
            { data: "brand", title: "Brand" }, 
            { data: "list_price", title: "List Price" },
            { data: "invoice_price", title: "Invoice Price" },
            { data: "qty", title: "Quantity" }, 
            { data: "status_label", title: "Status" }
        ],
        order: [[0, 'desc']],
        pageLength: 100
    });

  
    $('#datatable tbody').on('click', 'tr', function () {
        const data = table.row(this).data();
        if (!data) return;


        $('#item_id').val(data.id);
        $('#itemCode').val(data.code + ' - ' + data.name);      
          $('#itemName').val(data.name);
        $('#itemQty').val(1);
        $('#available_qty').val(data.qty);
        $('#list_price').val(data.list_price);
        $('#invoice_price').val(data.invoice_price);

        $('#dis_2').val(data.discount);

        // Match brand name to brand ID and set it
        $('#brand option').each(function () {
            if ($(this).text().trim() === data.brand.trim()) {
                $('#brand').val($(this).val());
                return false;
            }
        });

        // Get the selected brand ID after setting it
        const brandId = $('#brand').val();
        const categoryId = $('#category').val();    

        if (brandId) {
             $.ajax({
                url: 'ajax/php/arn-master.php',
                type: 'POST',
                data: {brand_id: brandId, category_id: categoryId },
                dataType: 'json',
                success: function (res) {

                     const totalDiscount = res && typeof res.total_discount !== 'undefined' ? res.total_discount : 0;

                     const discount_01 = res && typeof res.discount_01 !== 'undefined' ? res.discount_01 : 0;
                     const discount_02 = res && typeof res.discount_02 !== 'undefined' ? res.discount_02 : 0;
                     const discount_03 = res && typeof res.discount_03 !== 'undefined' ? res.discount_03 : 0;

                    $('#dis_1').val(totalDiscount);
                    $('#dis_6').val(discount_01);
                    $('#dis_7').val(discount_02);
                    $('#dis_8').val(discount_03);
                    
                    calculatePayment();
                },
                error: function (xhr, status, error) {
                    console.error('Failed to load brand discount. Status:', status, 'Error:', error);
                    console.error('Response:', xhr.responseText);
                    console.error('Brand ID:', brandId, 'Category ID:', categoryId);
                    $('#dis_1').val(0);
                    $('#dis_6').val(0);
                    $('#dis_7').val(0);
                    $('#dis_8').val(0);
                    calculatePayment();
                }
            });
        } else {
            $('#dis_1').val(0);
            $('#dis_6').val(0);
            $('#dis_7').val(0);
            $('#dis_8').val(0);
            calculatePayment();
        }

        setTimeout(() => $('#itemQty').focus(), 200);
        $('#main_item_master').modal('hide');
        
    });

    // $('#brand').on('change', function () {
    //     const brandId = $(this).val();

    //     if (!brandId) return;

    //     $.ajax({
    //         url: 'ajax/php/arn-master.php',
    //         type: 'POST',
    //         data: { brand_id: brandId },
    //         dataType: 'json',
    //         success: function (res) {
    //             const totalDiscount = res.total_discount || 0;
    //             $('#dis_1').val(totalDiscount);
    //             calculatePayment();
    //         },
    //         error: function () {
    //             console.error('Failed to load brand discount');
    //         }
    //     });
    // });


    // Bind Enter key to add item
    $('#rec_quantity, #invoice_price,  #credit_price, #actual_cost,#list_price,#dis_1,#dis_2,#dis_3,#dis_4,#dis_5').on('keydown', function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            $('#addItemBtn').trigger('click');
        }
    });

    // Reset input fields
    // Reset input fields + clear table
    $("#new").click(function (e) {
        e.preventDefault();

        // Reset form
        $('#form-data')[0].reset();
        $('#category').prop('selectedIndex', 0); // reset dropdown if needed

        // Clear item table
        $('#itemTableBody').empty();
       
        // Optionally put a "no items" row
        $('#itemTableBody').append(`
        <tr id="noDataRow">
            <td colspan="13" class="text-center text-muted">No items added</td>
        </tr>
    `);
    });


    function calculatePayment() {
        const recQty = parseFloat($('#rec_quantity').val()) || 0;
        const list_price = parseFloat($('#list_price').val()) || 0;
    
        // Get discounts
        const dis2 = parseFloat($('#dis_2').val()) || 0;
        const dis3 = parseFloat($('#dis_3').val()) || 0;
        const dis4 = parseFloat($('#dis_4').val()) || 0;
        const dis5 = parseFloat($('#dis_5').val()) || 0;
        const dis6 = parseFloat($('#dis_6').val()) || 0;
        const dis7 = parseFloat($('#dis_7').val()) || 0;
        const dis8 = parseFloat($('#dis_8').val()) || 0;
    
        // Calculate discounts step by step
        let disAmount2 = list_price * (dis2 / 100);
        let disAmount3 = (list_price - disAmount2) * (dis3 / 100);
        let disAmount4 = (list_price - disAmount2 - disAmount3) * (dis4 / 100);
        let disAmount5 = (list_price - disAmount2 - disAmount3 - disAmount4) * (dis5 / 100);
        let disAmount6 = (list_price - disAmount2 - disAmount3 - disAmount4 - disAmount5) * (dis6 / 100);
        let disAmount7 = (list_price - disAmount2 - disAmount3 - disAmount4 - disAmount5 - disAmount6) * (dis7 / 100);
        let disAmount8 = (list_price - disAmount2 - disAmount3 - disAmount4 - disAmount5 - disAmount6 - disAmount7) * (dis8 / 100);
    
        let finalCost = list_price - disAmount2 - disAmount3 - disAmount4 - disAmount5 - disAmount6 - disAmount7 - disAmount8;
        let unitTotal = finalCost * recQty;
    
        $('#actual_cost').val(finalCost.toFixed(2));
        $('#unit_total').val(unitTotal.toFixed(2));
    }
    

    // Bind function to relevant input fields
    $('#arn-item-table').on('input', '#list_price,#rec_quantity, #actual_cost,#dis_3,#dis_4,#dis_5', calculatePayment);


    $('#addItemBtn').on('click', function () {
        const item_id = $('#item_id').val();
        const code = $('#itemCode').val();
        const recQty = parseFloat($('#rec_quantity').val()) || 0;
        const brand = parseFloat($('#brand').val()) || 0;
 
        

        const dis1 = parseFloat($('#dis_1').val()) || 0; // Brand Discount
        const dis2 = parseFloat($('#dis_2').val()) || 0; // Item Discount
        const dis3 = parseFloat($('#dis_3').val()) || 0; // Dis 3
        const dis4 = parseFloat($('#dis_4').val()) || 0;
        const dis5 = parseFloat($('#dis_5').val()) || 0;

        const dis6 = parseFloat($('#dis_6').val()) || 0;
        const dis7 = parseFloat($('#dis_7').val()) || 0;
        const dis8 = parseFloat($('#dis_8').val()) || 0;

        const actualCost = parseFloat($('#actual_cost').val()) || 0;
        const unitTotal = parseFloat($('#unit_total').val()) || 0;
        const listPrice = parseFloat($('#list_price').val()) || 0;
        const InvoicePrice = parseFloat($('#invoice_price').val()) || 0;

        // ─────── Validations ───────
        if (!code) {
            swal({ title: "Error!", text: "Please select an Item Code", type: "error", timer: 2000, showConfirmButton: false });
            return;
        }

        if (!brand) {
            swal({ title: "Error!", text: "Please select a Brand.!", type: "error", timer: 2000, showConfirmButton: false });
            return;
        }

        if (!recQty || recQty <= 0) {
            swal({ title: "Error!", text: "Please enter a valid Received Quantity", type: "error", timer: 2000, showConfirmButton: false });
            return;
        }

        if (!listPrice || listPrice <= 0) {
            swal({ title: "Error!", text: "Please enter List Price", type: "error", timer: 2000, showConfirmButton: false });
            return;
        }

        // if (!listPrice || listPrice <= 0) {
        //     swal({ title: "Error!", text: "Please enter List Price", type: "error", timer: 2000, showConfirmButton: false });
        //     return;
        // }
        if (!InvoicePrice || InvoicePrice <= 0) {
            swal({ title: "Error!", text: "Please enter Invoice Price", type: "error", timer: 2000, showConfirmButton: false });
            return;
        }

        if (actualCost > listPrice) {
            swal({ title: "Error!", text: "Actual Cost cannot exceed List Price", type: "error", timer: 2000, showConfirmButton: false });
            return;
        }

        $('#noDataRow').remove();



        const newRow = `
        <tr data-itemid="${item_id}">
            <td>${code}</td>
            <td><input type="number" name="items[][order_qty]" class="form-control form-control-sm" readonly></td>
            <td><input type="number" name="items[][rec_qty]" class="form-control form-control-sm" value="${recQty}" readonly></td>
            <td><input type="number" name="items[][list_price]" class="form-control form-control-sm" value="${listPrice.toFixed(2)}" readonly></td>
            <td>
            <input type="number"  class="form-control form-control-sm" value="${dis1}" readonly>
            <input type="hidden" name="items[][dis6]" class="form-control form-control-sm" value="${dis6}" readonly>
            <input type="hidden" name="items[][dis7]" class="form-control form-control-sm" value="${dis7}" readonly>
            <input type="hidden" name="items[][dis8]" class="form-control form-control-sm" value="${dis8}" readonly>
            </td>
            <td><input type="number" name="items[][dis2]" class="form-control form-control-sm" value="${dis2}" readonly></td>
            <td><input type="number" name="items[][dis3]" class="form-control form-control-sm" value="${dis3}" readonly></td>
            <td><input type="number" name="items[][dis4]" class="form-control form-control-sm" value="${dis4}" readonly></td>
            <td><input type="number" name="items[][dis5]" class="form-control form-control-sm" value="${dis5}" readonly></td>
            <td><input type="number" name="items[][actual_cost]" class="form-control form-control-sm" value="${actualCost.toFixed(2)}" readonly></td>
            <td><input type="number" name="items[][unit_total]" class="form-control form-control-sm" value="${unitTotal.toFixed(2)}" readonly></td>
            <td><input type="number" name="items[][invoice_price]" class="form-control form-control-sm" value="${InvoicePrice.toFixed(2)}" readonly></td>
            <td>
                <div class="btn btn-danger btn-sm deleteRowBtn">
                    <i class="uil uil-trash-alt me-1"></i>
                </div>
            </td>
        </tr>
        `;


        $('#itemTableBody').append(newRow);

        // Update totals
        // Update totals manually
        const currentARN = parseFloat($('#total_arn').val()) || 0;
        $('#total_arn').val((currentARN + unitTotal).toFixed(2));

        const currentDiscount = parseFloat($('#total_discount').val()) || 0;
        const discountValue = (listPrice - actualCost) * recQty;
        $('#total_discount').val((currentDiscount + discountValue).toFixed(2));

        const currentReceivedQty = parseFloat($('#total_received_qty').val()) || 0;
        $('#total_received_qty').val((currentReceivedQty + recQty).toFixed(2));


        // Clear input fields
        $('#itemCode').val('');
        $('#rec_quantity').val('');
        $('#list_price').val('');
        $('#dis_1, #dis_2, #dis_3, #dis_4, #dis_5, #dis_6, #dis_7, #dis_8').val('');
        $('#actual_cost').val('');
        $('#unit_total').val('');
        $('#invoice_price').val('');
        updateSummaryValues();
    });

    $(document).on('click', '.deleteRowBtn', function () {
        const $row = $(this).closest('tr');// Remove row
        $row.remove();

        // If no rows left → show "no items" row
        if ($('#itemTableBody tr').length === 0) {
            $('#itemTableBody').append(`
            <tr id="noDataRow">
                <td colspan="13" class="text-center text-muted">No items added</td>
            </tr>
        `);
        }

        // Update summary
        if (typeof updateSummaryValues === 'function') {
            updateSummaryValues();
        }
    });


    $(document).on('click', '.select-purchase-order', function () {
        const id = $(this).data('id');
        const poNumber = $(this).data('po_number');
        const orderDate = $(this).data('order_date');
        const supplierId = $(this).data('supplier_id');
        const supplierCode = $(this).data('supplier_code');
        const supplierName = $(this).data('supplier_name');
        const supplierAddress = $(this).data('supplier_address');
        const piNo = $(this).data('pi_no');
        const lcTtNo = $(this).data('lc_tt_no');
        const brand = $(this).data('brand');
        const blNo = $(this).data('bl_no');
        const country = $(this).data('country');
        const ciNo = $(this).data('ci_no');
        const department = $(this).data('department');
        const orderBy = $(this).data('order_by');
        const remarks = $(this).data('remarks');
        const grandTotal = $(this).data('grand_total');
        const status = $('#status').val();

        // Set values to form inputs
        $('#purchase_order_id').val(id);
        $('#po_no').val(poNumber);
        $('#order_date').val(orderDate);
        $('#supplier_id').val(supplierId);
        $('#supplier_code').val(supplierCode);
        $('#supplier_name').val(supplierName);
        $('#supplier_address').val(supplierAddress);
        $('#pi_no').val(piNo);
        $('#lc_tt_no').val(lcTtNo);
        $('#brand').val(brand);
        $('#bl_no').val(blNo);
        $('#country').val(country);
        $('#ci_no').val(ciNo);
        $('#department_id').val(department);
        $('#order_by').val(orderBy);
        $('#remarks').val(remarks);
        $('#grandTotal').val(grandTotal);
        $('#finalTotal').val(grandTotal);

        if (typeof loadSupplierById === 'function') {
            loadSupplierById(supplierId);
        }

        // Fetch item details
        $.ajax({
            url: 'ajax/php/purchase-order.php',
            method: 'POST',
            data: { action: 'get_purchase_order', id: id, status: status },
            dataType: 'json',
            beforeSend: function () {
                $('body').preloader({ text: 'Loading purchase order...' });
            },
            success: function (response) {
                $('body').preloader('remove');

                if (response.status === 'success') {
                    const items = response.data.items || [];
                    $('#itemTableBody').empty();

                    if (items.length > 0) {
                        items.forEach((item, index) => {
                            const price = parseFloat(item.unit_price) || 0;
                            const qty = parseFloat(item.quantity) || 0;

                            const dis1 = item.brand_discount || 0;
                            const dis2 = item.item_discount || 0;
                            const dis3 = item.dis3 || 0;
                            const dis4 = item.dis4 || 0;
                            const dis5 = item.dis5 || 0;

                            // Calculate discounts
                            let disAmount1 = price * (dis1 / 100);
                            let disAmount2 = (price - disAmount1) * (dis2 / 100);
                            let disAmount3 = (price - disAmount1 - disAmount2) * (dis3 / 100);
                            let disAmount4 = (price - disAmount1 - disAmount2 - disAmount3) * (dis4 / 100);
                            let disAmount5 = (price - disAmount1 - disAmount2 - disAmount3 - disAmount4) * (dis5 / 100);
                            let finalCost = price - disAmount1 - disAmount2 - disAmount3 - disAmount4 - disAmount5;

                            const actualCost = finalCost;

                            const unitTotal = finalCost * qty;


                            const row = `
                            <tr data-item-id="${item.item_id}">
                                <td style="width: 250px;">
                                    ${item.item_code} - ${item.item_name}
                                    <input type="hidden" name="items[${index}][item_id]" value="${item.item_id}">
                                </td>
                                <td><input type="number" name="items[${index}][order_qty]" class="form-control form-control-sm" readonly value="${qty}"></td>

                                <td><input type="number" name="items[${index}][rec_qty]" class="form-control form-control-sm" value="${item.rec_qty || 0}"></td>
                                <td><input type="number" step="0.01" name="items[${index}][list_price]" class="form-control form-control-sm" value="${item.item_list_price || 0}"></td>
                                <td><input type="number" step="0.01" name="items[${index}][brand_discount]" class="form-control form-control-sm me-1" value="${item.brand_discount || 0}" placeholder="D1"></td>
                                <td><input type="number" step="0.01" name="items[${index}][item_discount]" class="form-control form-control-sm" value="${item.item_discount || 0}" placeholder="D2"></td>
                                <td><input type="number" step="0.01" name="items[${index}][dis3]" class="form-control form-control-sm" value="${item.dis3 || 0}" placeholder="D3"></td>
                                <td><input type="number" step="0.01" name="items[${index}][dis4]" class="form-control form-control-sm" value="${item.dis4 || 0}" placeholder="D4"></td>
                                <td><input type="number" step="0.01" name="items[${index}][dis5]" class="form-control form-control-sm" value="${item.dis5 || 0}" placeholder="D5"></td>
                                <td><input type="number" step="0.01" name="items[${index}][actual_cost]" class="form-control form-control-sm" value="${actualCost.toFixed(2)}"></td>
                                <td><input type="number" step="0.01" name="items[${index}][unit_total]" class="form-control form-control-sm" value="${unitTotal.toFixed(2)}" readonly></td>
                                <td><input type="number" step="0.01" name="items[${index}][list_price]" class="form-control form-control-sm" value="${item.item_selling_price}"></td>
                               <td>
                                <button class="btn btn-danger btn-sm deleteRowBtn">
                                    <i class="uil uil-trash-alt me-1"></i>
                                </button>
                                </td>
                            </tr>
                        `;
                            $('#itemTableBody').append(row);
                        });

                        $('#arn-item-table').hide();
                        $('#itemTable').removeClass('mt-5');
                    } else {
                        $('#itemTableBody').append(`
                        <tr id="noDataRow">
                            <td colspan="13" class="text-center text-muted">No items found</td>
                        </tr>
                    `);
                    }

                    $('#create').hide();
                    $('#update').show();
                    $('.delete-po').show();
                    $('#po_number_modal').modal('hide');
                    updateSummaryValues();
                } else {
                    swal({
                        title: "Error!",
                        text: "Failed to load purchase order.",
                        icon: 'error',
                        timer: 2500,
                        buttons: false
                    });
                }
            },
            error: function (xhr) {
                $('body').preloader('remove');
                console.error("AJAX error:", xhr.responseText);
                swal({
                    title: "Error!",
                    text: "AJAX request failed. Please try again.",
                    icon: 'error',
                    timer: 2500,
                    buttons: false
                });
            }
        });
    });

    // Function to recalculate row values
    function recalcRow($row) {
        const price = parseFloat($row.find('input[name*="[list_price]"]').val()) || 0;
        const qty = parseFloat($row.find('input[name*="[rec_qty]"]').val()) || 0;
 
        const dis2 = parseFloat($row.find('input[name*="[item_discount]"]').val()) || 0;
        const dis3 = parseFloat($row.find('input[name*="[dis3]"]').val()) || 0;
        const dis4 = parseFloat($row.find('input[name*="[dis4]"]').val()) || 0;
        const dis5 = parseFloat($row.find('input[name*="[dis5]"]').val()) || 0;
        const dis6 = parseFloat($row.find('input[name*="[dis6]"]').val()) || 0;
        const dis7 = parseFloat($row.find('input[name*="[dis7]"]').val()) || 0;
        const dis8 = parseFloat($row.find('input[name*="[dis8]"]').val()) || 0;

        // Apply discounts step by step
        let disAmount2 = (price) * (dis2 / 100);
        let disAmount3 = (price - disAmount2) * (dis3 / 100);
        let disAmount4 = (price - disAmount2 - disAmount3) * (dis4 / 100);
        let disAmount5 = (price - disAmount2 - disAmount3 - disAmount4) * (dis5 / 100);
        let disAmount6 = (price - disAmount2 - disAmount3 - disAmount4 - disAmount5) * (dis6 / 100);
        let disAmount7 = (price - disAmount2 - disAmount3 - disAmount4 - disAmount5 - disAmount6) * (dis7 / 100);
        let disAmount8 = (price - disAmount2 - disAmount3 - disAmount4 - disAmount5 - disAmount6 - disAmount7) * (dis8 / 100);
        let finalCost = price - disAmount2 - disAmount3 - disAmount4 - disAmount5 - disAmount6 - disAmount7 - disAmount8;

        const actualCost = finalCost;
        const unitTotal = actualCost * qty;

        // Update fields
        $row.find('input[name*="[actual_cost]"]').val(actualCost.toFixed(2));
        $row.find('input[name*="[unit_total]"]').val(unitTotal.toFixed(2));

        // Call summary update
        if (typeof updateSummaryValues === "function") {
            updateSummaryValues();
        }
    }

    // Attach event listener to recalc whenever values change
    $(document).on('input change', '#itemTableBody input', function () {
        const $row = $(this).closest('tr');
        recalcRow($row);
    });




    $(document).on('input', '#itemTableBody input', function () {
        updateSummaryValues();
    });

    function updateSummaryValues() {
        let totalDiscount = 0;
        let totalVAT = 0;
        let totalReceivedQty = 0;
        let totalOrderQty = 0;
        let totalARN = 0;

        // Loop through each row in itemTable
        $('#itemTableBody tr').each(function () {
           
            const dis2 = parseFloat($(this).find('[name*="[dis2]"]').val()) || 0;
            const dis3 = parseFloat($(this).find('[name*="[dis3]"]').val()) || 0;
            const dis4 = parseFloat($(this).find('[name*="[dis4]"]').val()) || 0;
            const dis5 = parseFloat($(this).find('[name*="[dis5]"]').val()) || 0;
            const dis6 = parseFloat($(this).find('[name*="[dis6]"]').val()) || 0;
            const dis7 = parseFloat($(this).find('[name*="[dis7]"]').val()) || 0;
            const dis8 = parseFloat($(this).find('[name*="[dis8]"]').val()) || 0;
            const vat = parseFloat($(this).find('[name*="[vat]"]').val()) || 0;
            const recQty = parseFloat($(this).find('[name*="[rec_qty]"]').val()) || 0;
            const orderQty = parseFloat($(this).find('[name*="[order_qty]"]').val()) || 0;
            const total = parseFloat($(this).find('[name*="[unit_total]"]').val()) || 0;

            totalDiscount += dis2 + dis3 + dis4 + dis5 + dis6 + dis7 + dis8s;
            totalVAT += vat;
            totalReceivedQty += recQty;
            totalOrderQty += orderQty;
            totalARN += total;
        });

        // Update the summary fields
        $('#total_discount').val(totalDiscount.toFixed(2));
        $('#total_vat').val(totalVAT.toFixed(2));
        $('#total_received_qty').val(totalReceivedQty.toFixed(2));
        $('#total_order_qty').val(totalOrderQty.toFixed(2));
        $('#total_arn').val(totalARN.toFixed(2));
    }

    //create arn
    $('#create_arn').on('click', function (e) {
        e.preventDefault();

        const arnNo = $('#arn_no').val();
        const supplier = $('#supplier_id').val();

        if (!arnNo || arnNo.length === 0) {
            return swal({
                title: "Error!",
                text: "Please enter an ARN Number",
                type: "error",
                timer: 2000,
                showConfirmButton: false,
            });
        }

        if (!supplier || supplier.length === 0) {
            return swal({
                title: "Error!",
                text: "Please select a Supplier",
                type: "error",
                timer: 2000,
                showConfirmButton: false,
            });
        }

        let items = [];
        let hasInvalidItem = false;

        $('#itemTableBody tr').each(function () {
            if ($(this).attr('id') === 'noDataRow') return;

            const $row = $(this);
            const cols = $row.find('td');
            const itemId = $row.attr('data-itemid');


            const actualCost = parseFloat($(cols[7]).find('input').val()) || 0;
            const listPrice = parseFloat($(cols[3]).find('input').val()) || 0;


            // Validation: actualCost should not exceed listPrice
            if (actualCost > listPrice) {
                hasInvalidItem = true;
                return swal({
                    title: "Error!",
                    text: `Actual cost cannot exceed List Price for item: ${$(cols[0]).text().trim()}`,
                    type: "error",
                    timer: 3000,
                    showConfirmButton: false
                });
            }

            items.push({
                item_id: itemId,
                code: $(cols[0]).text().trim(),
                order_qty: parseFloat($(cols[1]).find("input").val()) || 0,
                rec_qty: parseFloat($(cols[2]).find("input").val()) || 0,
                list_price: parseFloat($(cols[3]).find("input").val()) || 0,
                dis1: parseFloat($(cols[4]).find("input").val()) || 0,
                
                dis6: parseFloat($(cols[4]).find('input[name*="dis6"]').val()) || 0, 
                dis7: parseFloat($(cols[4]).find('input[name*="dis7"]').val()) || 0, 
                dis8: parseFloat($(cols[4]).find('input[name*="dis8"]').val()) || 0, 
                
                dis2: parseFloat($(cols[5]).find("input").val()) || 0,
                dis3: parseFloat($(cols[6]).find("input").val()) || 0,
                dis4: parseFloat($(cols[7]).find("input").val()) || 0,
                dis5: parseFloat($(cols[8]).find("input").val()) || 0,
                
               
                actual_cost: parseFloat($(cols[9]).find("input").val()) || 0,
                unit_total: parseFloat($(cols[10]).find("input").val()) || 0, 
                invoice_price: parseFloat($(cols[11]).find("input").val()) || 0,
            });
        });

        if (hasInvalidItem) return;

        if (items.length === 0) {
            return swal({
                title: "Error!",
                text: "No items to submit",
                type: "error",
                timer: 2000,
                showConfirmButton: false
            });
        }

        const payload = {
            create: true,
            arn_no: arnNo,
            supplier: supplier,
            arn_date: $('#entry_date').val(),
            ci_no: $('#ci_no').val(),
            lc_no: $('#lc_tt_no').val(),
            bl_no: $('#bl_no').val(),
            brand: $('#brand').val(),
            category: $('#category').val(),
            order_by: $('#order_by').val(),
            credit_note_amount: $('#credit_note_amount').val(),
            delivery_date: $('#delivery_date').val(),
            purchase_type: $('#purchase_type').val(),
            country: $('#country').val(),
            arn_status: $('#arn_status').val(),
            delivery_date: $('#delivery_date').val(),

            pi_no: $('#pi_no').val(),
            department_id: $('#department_id').val(),
            purchase_order_id: $('#purchase_order_id').val(),
            purchase_date: $('#order_date').val(),
            invoice_date: $('#invoice_date').val(),
            entry_date: $('#entry_date').val(),
            total_arn: parseFloat($('#total_arn').val()) || 0,
            total_discount: parseFloat($('#total_discount').val()) || 0,
            total_vat: parseFloat($('#total_vat').val()) || 0,
            total_received_qty: parseFloat($('#total_received_qty').val()) || 0,
            total_order_qty: parseFloat($('#total_order_qty').val()) || 0,
            items: items
        };

        $.ajax({
            url: "ajax/php/arn-master.php",
            type: "POST",
            data: JSON.stringify(payload),
            contentType: "application/json",
            success: function (response) {
                if (response.status === 'success') {
                    swal({
                        title: "Success!",
                        text: "ARN created successfully!",
                        type: "success",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setTimeout(() => location.reload(), 2000);
                } else {
                    swal({
                        title: "Error!",
                        text: response.message || "Failed to create ARN.",
                        icon: "error",
                        timer: 2000,
                        buttons: false,
                    });
                }
            },
            error: function () {
                swal({
                    title: "Error!",
                    text: "Server error. Please try again.",
                    icon: "error",
                    timer: 2000,
                    buttons: false,
                });
            }
        });
    });


    $(document).on('click', '.select-arn-order', function () {
        const row = $(this);

        // Get data attributes from selected row
        const arnData = {
            id: row.data('id'),
            arn_no: row.data('arn_no'),
            po_no: row.data('po_number'),
            order_date: row.data('order_date'),
            supplier_id: row.data('supplier_id'),
            supplier_code: row.data('supplier_code'),
            supplier_name: row.data('supplier_name'),
            supplier_address: row.data('supplier_address'),
            pi_no: row.data('pi_no'),
            lc_tt_no: row.data('lc_tt_no'),
            brand: row.data('brand'),
            bl_no: row.data('bl_no'),
            ci_no: row.data('ci_no'),
            country: row.data('country'),
            department: row.data('department'),
            grand_total: row.data('grand_total'),
            total_discount: row.data('total_discount'),
            total_received_qty: row.data('total_received_qty'),
            total_order_qty: row.data('total_order_qty'),
            status: row.data('status'),
            remarks: row.data('remarks'),
            is_cancelled: row.data('is_cancelled')
        };

        // Fill form fields (update selectors based on your actual form field IDs or classes)
        $('#arn_id').val(arnData.id);
        $('#arn_no').val(arnData.arn_no);
        $('#po_date').val(arnData.order_date);
        $('#supplier_id').val(arnData.supplier_id);
        $('#supplier_code').val(arnData.supplier_code);
        $('#supplier_name').val(arnData.supplier_name);
        $('#supplier_address').val(arnData.supplier_address);
        $('#pi_no').val(arnData.pi_no);
        $('#lc_tt_no').val(arnData.lc_tt_no);
        $('#brand').val(arnData.brand);
        $('#bl_no').val(arnData.bl_no);
        $('#ci_no').val(arnData.ci_no);
        $('#country').val(arnData.country);
        $('#department_id').val(arnData.department);
        $('#total_arn').val(parseFloat(arnData.grand_total).toFixed(2));
        $('#remarks').val(arnData.remarks);
        $('#arn_status').val(arnData.status);
        $('#total_discount').val(arnData.total_discount);
        $('#total_received_qty').val(arnData.total_received_qty);
        $('#total_order_qty').val(arnData.total_order_qty);
        // Close modal
        $('#arn_modal').modal('hide');

        // Optional: load items via AJAX if needed
        loadArnItems(arnData.id);
        if (arnData.is_cancelled === 1 || arnData.is_cancelled === '1') {
            $('.cancel-arn-btn').prop('disabled', true).text('Already Cancelled');
            $('.cancel-arn-btn').show();
            $('#create_arn').hide();
        } else {
            $('.cancel-arn-btn').show();
            $('#create_arn').hide();
            $('.cancel-arn-btn').prop('disabled', false).text('Cancel ARN');
        }
    });

    //load arn items
    function loadArnItems(arnId) {
        $.ajax({
            url: "ajax/php/arn-master.php",
            method: 'POST',
            data: { arn_id: arnId },
            dataType: 'json',
            success: function (items) {
                const tbody = $('#itemTableBody');
                tbody.empty();

                if (items.length === 0) {
                    tbody.append('<tr id="noDataRow"><td colspan="13" class="text-center">No data available</td></tr>');
                    return;
                }

                items.forEach(item => { 
                    const d6 = parseFloat(item.discount_6) || 0;
                    const d7 = parseFloat(item.discount_7) || 0;
                    const d8 = parseFloat(item.discount_8) || 0;
                
                    const dis1 = d6 + d7 + d8;

                    const row = `
                        <tr data-itemid="${item.item_code}">
                           <td>${item.item_code + ' - ' + item.item_name}  </td>
                            <td><input type="number" name="items[][order_qty]" class="form-control form-control-sm" value="${item.order_qty}" readonly></td>
                            <td><input type="number" name="items[][rec_qty]" class="form-control form-control-sm" value="${item.received_qty}" readonly></td>
                            <td><input type="number" name="items[][dis2]" class="form-control form-control-sm" value="${item.list_price}" readonly></td>
                            <td><input type="number" name="items[][dis3]" class="form-control form-control-sm" value="${dis1}" readonly></td>
                            <td><input type="number" name="items[][dis4]" class="form-control form-control-sm" value="${item.discount_2 || 0}" readonly></td>
                            <td><input type="number" name="items[][dis5]" class="form-control form-control-sm" value="${item.discount_3 || 0}" readonly></td>
                            <td><input type="number" name="items[][dis6]" class="form-control form-control-sm" value="${item.discount_4 || 0}" readonly></td>
                            <td><input type="number" name="items[][dis7]" class="form-control form-control-sm" value="${item.discount_5 || 0}" readonly></td>
                            <td><input type="number" name="items[][actual_cost]" class="form-control form-control-sm" value="${item.final_cost}" readonly></td>
                            <td><input type="number" name="items[][unit_total]" class="form-control form-control-sm" value="${item.unit_total}" readonly></td>
                            <td><input type="number" name="items[][list_price]" class="form-control form-control-sm" value="${item.list_price}" readonly></td>
                            <td> </td>
                        </tr>
                    `;
                    tbody.append(row);
                });
            },
            error: function (err) {
                console.error("Failed to fetch ARN items:", err);
            }
        });
    }


    //Cancel ARN
    $(document).on("click", ".cancel-arn-btn", function (e) {
        e.preventDefault();

        var arnId = $("#arn_id").val();
        var arnNo = $("#arn_no").val();

        if (!arnId || !arnNo) {
            swal({
                title: "Error!",
                text: "Please select a valid ARN first.",
                type: "error",
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        swal(
            {
                title: "Are you sure?",
                text: "Do you want to cancel ARN No: '" + arnNo + "'?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, cancel it!",
                cancelButtonText: "No",
                closeOnConfirm: false,
            },
            function (isConfirm) {
                if (isConfirm) {
                    $(".someBlock").preloader();

                    $.ajax({
                        url: "ajax/php/arn-master.php",
                        type: "POST",
                        data: {
                            arn_id_cancel: arnId,
                        },
                        dataType: "json",
                        success: function (response) {
                            $(".someBlock").preloader("remove");

                            if (response.status === "success") {
                                swal({
                                    title: "Cancelled!",
                                    text: "ARN has been cancelled successfully.",
                                    type: "success",
                                    timer: 2000,
                                    showConfirmButton: false,
                                });

                                setTimeout(() => {
                                    window.location.reload();
                                }, 2000);
                            } else {
                                swal({
                                    title: "Error!",
                                    text: response.message || "Something went wrong.",
                                    type: "error",
                                    timer: 2000,
                                    showConfirmButton: false,
                                });
                            }
                        },
                        error: function () {
                            $(".someBlock").preloader("remove");
                            swal({
                                title: "Error!",
                                text: "Request failed. Please try again.",
                                type: "error",
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                    });
                }
            }
        );
    });





});


