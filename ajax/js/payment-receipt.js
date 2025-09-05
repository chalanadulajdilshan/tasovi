jQuery(document).ready(function ($) {
  // Configuration constants
  const CONFIG = {
    CHEQUE_NO_REGEX: /^\d{6,12}$/,
    MIN_AMOUNT: 0.01,
    SWAL_TIMEOUT: 3000,
  };

  // Centralized state management
  const state = {
    chequeInfo: [],
    totalUsed: 0,
    totalAvailable: 0,
    cashTotal: 0,
    cashBalance: 0,
  };

  // Utility functions
  function formatAmount(amount) {
    return parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseAmount(value) {
    let num = parseFloat(value.toString().replace(/,/g, ""));
    return isNaN(num) ? 0 : num;
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function isValidChequeNo(chequeNo) {
    return CONFIG.CHEQUE_NO_REGEX.test(chequeNo);
  }

  function isValidDate(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(dateStr);
    return !isNaN(inputDate.getTime()) && inputDate >= today;
  }

  // State and UI updates
  function updateState($excludeRow = null) {
    state.totalUsed = 0;
    state.totalAvailable = 0;

    state.chequeInfo.forEach((cheque) => {
      let usedAmount = 0;
      $(".cheque-select").each(function () {
        const $select = $(this);
        const $row = $select.closest("tr");
        if ($select.val() === cheque.id && (!$excludeRow || !$row.is($excludeRow))) {
          usedAmount += parseAmount($row.find(".cheque-pay").val());
        }
      });
      cheque.usedAmount = usedAmount;
      cheque.remaining = Math.max(0, cheque.amount - usedAmount);
      cheque.used = cheque.remaining <= CONFIG.MIN_AMOUNT;
      state.totalUsed += usedAmount;
      state.totalAvailable += cheque.remaining;
    });

    state.cashTotal = parseAmount($("#cash_total").val());
    state.cashBalance = state.cashTotal - calculateTotalCashPay($excludeRow);

    $("#cheque_total").val(formatAmount(state.totalUsed));
    $("#cheque_balance").val(formatAmount(state.totalAvailable));
    $("#cash_balance").val(formatAmount(state.cashBalance));

    updateChequeDropdowns();
    updateTotals();
  }

  function calculateTotalCashPay($excludeRow = null) {
    let total = 0;
    $(".cash-pay").each(function () {
      const $row = $(this).closest("tr");
      if (!$excludeRow || !$row.is($excludeRow)) {
        total += parseAmount($(this).val());
      }
    });
    return total;
  }

  function updateChequeDropdowns() {
    const $selects = $(".cheque-select");
    $selects.each(function () {
      const $select = $(this);
      const selectedValue = $select.val();
      const $row = $select.closest("tr");

      $select.find("option").not(":first").each(function () {
        const chequeId = $(this).val();
        const cheque = state.chequeInfo.find((c) => c.id === chequeId);
        if (cheque) {
          const isSelected = cheque.id === selectedValue;
          const displayAmount = isSelected
            ? formatAmount(cheque.amount)
            : `${formatAmount(cheque.remaining)} of ${formatAmount(cheque.amount)}`;
          $(this).text(`${cheque.chequeNo} (${displayAmount})`);
          $(this).prop("disabled", cheque.used && !isSelected);
        } else {
          $(this).remove();
        }
      });

      state.chequeInfo.forEach((cheque) => {
        if (!$select.find(`option[value="${cheque.id}"]`).length && cheque.remaining > CONFIG.MIN_AMOUNT) {
          $select.append(
            $("<option>", {
              value: cheque.id,
              "data-amount": cheque.remaining,
              disabled: cheque.used,
            }).text(`${cheque.chequeNo} (${formatAmount(cheque.remaining)} of ${formatAmount(cheque.amount)})`)
          );
        }
      });

      if ($select.find(`option[value="${selectedValue}"]`).length && selectedValue) {
        $select.val(selectedValue);
      } else {
        $select.val("");
        $row.find(".cheque-pay").val("0.00");
      }
    });
  }

  function updateRowBalance($row) {
    const overdue = parseAmount($row.find(".invoice-overdue").text());
    const chequePay = parseAmount($row.find(".cheque-pay").val());
    const cashPay = parseAmount($row.find(".cash-pay").val());
    const remaining = overdue - (chequePay + cashPay);
    $row.find(".balance-amount").text(formatAmount(remaining));
  }

  function updateTotals() {
    let grandTotal = 0;
    $("#invoiceBody tr").not("#noItemRow").each(function () {
      const overdue = parseAmount($(this).find(".invoice-overdue").text());
      grandTotal += overdue;
    });
    $("#grandTotal").val(formatAmount(grandTotal));
    $("#finalTotal").val(formatAmount(grandTotal));
    $("#disTotal").val(formatAmount(0));
  }

  function validateChequePayment($input, $row) {
    let inputVal = parseAmount($input.val());
    const overdue = parseAmount($row.find(".invoice-overdue").text());
    const selectedChequeId = $row.find(".cheque-select").val();
    if (!selectedChequeId) {
      $input.val("0.00");
      return 0;
    }

    const selectedCheque = state.chequeInfo.find((c) => c.id === selectedChequeId);
    if (!selectedCheque) {
      $input.val("0.00");
      return 0;
    }

    let usedAmount = 0;
    $(".cheque-select").each(function () {
      const $currentSelect = $(this);
      const $currentRow = $currentSelect.closest("tr");
      if ($currentSelect.val() === selectedChequeId && !$currentRow.is($row)) {
        usedAmount += parseAmount($currentRow.find(".cheque-pay").val());
      }
    });

    const remainingBalance = selectedCheque.amount - usedAmount;
    const maxAllowed = Math.min(overdue, remainingBalance);

    if (inputVal > maxAllowed) {
      inputVal = maxAllowed;
      $input.val(formatAmount(maxAllowed));
      swal({
        title: "Invalid Amount!",
        text: `You can't enter more than Overdue (Rs. ${formatAmount(overdue)}) or Remaining Cheque Balance (Rs. ${formatAmount(remainingBalance)})`,
        type: "error",
        timer: CONFIG.SWAL_TIMEOUT,
        showConfirmButton: false,
      });
    }
    return inputVal;
  }

  function validateCashPayment($input, $row) {
    let inputVal = parseAmount($input.val());
    const overdue = parseAmount($row.find(".invoice-overdue").text());
    let usedCash = 0;
    $(".cash-pay").each(function () {
      const $currentRow = $(this).closest("tr");
      if (!$currentRow.is($row)) {
        usedCash += parseAmount($(this).val());
      }
    });
    const remainingBalance = state.cashTotal - usedCash;
    const maxAllowed = Math.min(overdue, remainingBalance);

    if (inputVal > maxAllowed) {
      inputVal = maxAllowed;
      $input.val(formatAmount(maxAllowed));
      swal({
        title: "Invalid Amount!",
        text: `You can't enter more than Overdue (Rs. ${formatAmount(overdue)}) or Remaining Cash Balance (Rs. ${formatAmount(remainingBalance)})`,
        type: "error",
        timer: CONFIG.SWAL_TIMEOUT,
        showConfirmButton: false,
      });
    }
    return inputVal;
  }

  function validateCashTotal($excludeRow = null) {
    let totalCashPay = calculateTotalCashPay($excludeRow);
    return totalCashPay <= state.cashTotal;
  }

  function toggleCashPay() {
    const cashTotal = parseAmount($("#cash_total").val());
    if (cashTotal > 0) {
      $(".cash-pay").prop("disabled", false);
    } else {
      $(".cash-pay").prop("disabled", true).val("0.00");
    }
  }

  // Event handlers
  $(document).on("change", ".cheque-select", function () {
    const $select = $(this);
    const $row = $select.closest("tr");
    const selectedChequeId = $select.val();
    const $chequeInput = $row.find(".cheque-pay");
    const prevChequeId = $select.data("prev-cheque");

    if (prevChequeId && prevChequeId !== selectedChequeId) {
      $select.removeData("prev-cheque");
    }

    if (selectedChequeId) {
      const selectedCheque = state.chequeInfo.find((c) => c.id === selectedChequeId);
      if (selectedCheque) {
        $select.data("prev-cheque", selectedChequeId);
        const maxAmount = parseAmount($row.find(".invoice-overdue").text());
        let usedAmount = 0;
        $(".cheque-select").each(function () {
          const $currentSelect = $(this);
          const $currentRow = $currentSelect.closest("tr");
          if ($currentSelect.val() === selectedChequeId && !$currentRow.is($row)) {
            usedAmount += parseAmount($currentRow.find(".cheque-pay").val());
          }
        });
        const remainingBalance = selectedCheque.amount - usedAmount;
        if (prevChequeId !== selectedChequeId) {
          const chequeAmount = Math.min(remainingBalance, maxAmount);
          $chequeInput.val(formatAmount(chequeAmount));
        }
      }
    } else {
      $chequeInput.val("0.00");
    }

    updateState($row);
    updateRowBalance($row);
  });

  $(document).on("focus", ".cheque-pay, .cash-pay", function () {
    const $input = $(this);
    let value = $input.val().replace(/[^0-9.]/g, "");
    $input.val(value === "0" ? "" : value);
  });

  $(document).on(
    "input",
    ".cheque-pay, .cash-pay",
    debounce(function () {
      const $input = $(this);
      const $row = $input.closest("tr");
      let value = $input.val().replace(/[^0-9.]/g, "");
      if (value === "") {
        $input.val("0.00");
        updateRowBalance($row);
        updateState($row);
        return;
      }
      if ($input.hasClass("cheque-pay")) {
        validateChequePayment($input, $row);
      } else if ($input.hasClass("cash-pay")) {
        validateCashPayment($input, $row);
      }
      updateRowBalance($row);
      updateState($row);
    }, 300)
  );

  $(document).on("blur", ".cheque-pay, .cash-pay", function () {
    const $input = $(this);
    const $row = $input.closest("tr");
    let amount = parseAmount($input.val()) || 0;
    if ($input.hasClass("cheque-pay")) {
      amount = validateChequePayment($input, $row);
    } else if ($input.hasClass("cash-pay")) {
      amount = validateCashPayment($input, $row);
    }
    $input.val(amount === 0 ? "0.00" : formatAmount(amount));
    updateRowBalance($row);
    updateState($row);
  });

  $("#add_cheque").on("click", function () {
    const chequeNo = $("#cheque_no").val().trim();
    const chequeDate = $("#cheque_date").val().trim();
    const bankBranch = $("#bank_branch_name").val().trim();
    const bankBranchId = $("#bank_branch").val().trim();
    const amount = parseAmount($("#amount").val());
    const chequeTotal = parseAmount($("#cheque_total").val());
    const outstanding = parseAmount($("#outstanding").val());

    if (!isValidChequeNo(chequeNo)) {
      return swal("Invalid Cheque Number", "Cheque number should be 6–12 digits.", "error");
    }
    if (!isValidDate(chequeDate)) {
      return swal("Invalid Cheque Date", "Cheque date must be today or a future date.", "error");
    }
    if (!bankBranch || !bankBranchId) {
      return swal("Missing Bank", "Please select a valid Bank & Branch.", "error");
    }
    if (amount <= 0) {
      return swal("Invalid Amount", "Amount should be a number greater than 0.", "error");
    }
    if (chequeTotal + amount > outstanding) {
      return swal("Exceeded Outstanding", "You added more than the Outstanding Amount.", "error");
    }

    $("#noItemRow").remove();
    const chequeId = "cheque_" + Date.now();
    state.chequeInfo.push({
      id: chequeId,
      chequeNo,
      chequeDate,
      bankBranch,
      bankBranchId,
      amount,
      used: false,
      usedAmount: 0,
      remaining: amount,
    });

    const newRow = `
      <tr data-cheque-id="${chequeId}">
        <td>${chequeNo}<input type="hidden" name="cheque_nos[]" value="${chequeNo}"></td>
        <td>${chequeDate}<input type="hidden" name="cheque_dates[]" value="${chequeDate}"></td>
        <td>${bankBranch}<input type="hidden" name="bank_branches[]" value="${bankBranchId}"></td>
        <td class="cheque-amount" data-amount="${amount}">${formatAmount(amount)}<input type="hidden" name="cheque_amounts[]" value="${amount}"></td>
        <td><button type="button" class="btn btn-sm btn-danger remove-row">Remove</button></td>
      </tr>`;
    $("#chequeBody").append(newRow);
    updateState();

    $("#cheque_no, #cheque_date, #bank_branch_name, #bank_branch, #amount").val("");
  });

  $("#cheque_no, #cheque_date, #bank_branch_name, #amount").on("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      $("#add_cheque").click();
    }
  });

  $("#chequeBody").on("click", ".remove-row", function () {
    const $row = $(this).closest("tr");
    const chequeId = $row.data("cheque-id");
    $row.remove();
    if (chequeId) {
      const index = state.chequeInfo.findIndex((cheque) => cheque.id === chequeId);
      if (index > -1) {
        state.chequeInfo.splice(index, 1);
      }
    }
    if ($("#chequeBody tr").length === 0) {
      $("#chequeBody").append(
        `<tr id="noItemRow"><td colspan="5" class="text-center text-muted">No items added</td></tr>`
      );
    }
    updateState();
  });

  $(document).on("click", ".select-branch", function () {
    const branchId = $(this).data("id");
    const bankBranchName = $(this).find("td:eq(2)").text();
    $("#bank_branch").val(branchId);
    $("#bank_branch_name").val(bankBranchName);
    $("#branch_master").modal("hide");
  });

  let customerTableInitialized = false;
  function loadCustomerTable() {
    if (!customerTableInitialized) {
      $("#customerTable").DataTable({
        processing: true,
        serverSide: true,
        ajax: {
          url: "ajax/php/customer-master.php",
          type: "POST",
          data: function (d) {
            d.filter = true;
            d.category = 1;
          },
          dataSrc: function (json) {
            return json.data;
          },
          error: function (xhr) {
            console.error("Server Error Response:", xhr.responseText);
            swal("Error", "Failed to load customer data.", "error");
          },
        },
        columns: [
          { data: "key", title: "#ID" },
          { data: "code", title: "Code" },
          { data: "name", title: "Name" },
          { data: "mobile_number", title: "Mobile" },
          { data: "email", title: "Email" },
          { data: "category", title: "Category" },
          { data: "province", title: "Province" },
          { data: "credit_limit", title: "Credit Limit" },
          { data: "outstanding", title: "Outstanding" },
        ],
        order: [[0, "desc"]],
        pageLength: 100,
      });
      customerTableInitialized = true;
    } else {
      $("#customerTable").DataTable().ajax.reload();
    }

    $("#customerTable tbody").off("click", "tr").on("click", "tr", function () {
      const data = $("#customerTable").DataTable().row(this).data();
      if (data) {
        $("#customer_id").val(data.id);
        $("#customer_code").val(data.code);
        $("#customer_name").val(data.name);
        $("#customer_address").val(data.address);
        $("#outstanding").val(data.outstanding);
        $("#customerModal").modal("hide");
        loadCustomerCreditInvoices(data.id);
      }
    });
  }

  $("#customerModal").on("shown.bs.modal", function () {
    loadCustomerTable();
  });

  function loadCustomerCreditInvoices(customerId) {
    if (!customerId) return;
    $.ajax({
      url: "ajax/php/payment-receipt.php",
      type: "POST",
      data: { action: "get_credit_invoices", customer_id: customerId },
      dataType: "json",
      success: function (response) {
        $("#invoiceBody").empty();
        if (response.success && response.data.length > 0) {
          let subTotal = 0;
          response.data.forEach(function (invoice) {
            const invoiceValue = parseFloat(invoice.grand_total || 0);
            const paidAmount = parseFloat(invoice.paid_amount || 0);
            const overdue = invoiceValue - paidAmount;
            subTotal += invoiceValue;
            const row = `
              <tr>
                <td>${invoice.invoice_date}</td>
                <td class="hidden"><input type="hidden" name="invoice_id[]" value="${invoice.id}">${invoice.id}</td>
                <td>${invoice.invoice_no}</td>
                <td>${formatAmount(invoiceValue)}</td>
                <td>${formatAmount(paidAmount)}</td>
                <td><span class="text-danger fw-bold invoice-overdue">${formatAmount(overdue)}</span></td>
                <td>
                  <input type="text" name="cheque_pay[]" class="form-control form-control-sm cheque-pay" value="0.00">
                  <select name="cheque_select[]" class="form-select form-select-sm mt-1 cheque-select">
                    <option value="">Select Cheque</option>
                    ${state.chequeInfo
                      .map(
                        (cheque) =>
                          `<option value="${cheque.id}" data-amount="${cheque.amount}" ${cheque.used ? "disabled" : ""}>
                            ${cheque.chequeNo} (${formatAmount(cheque.amount)})
                          </option>`
                      )
                      .join("")}
                  </select>
                </td>
                <td><input type="text" name="cash_pay[]" disabled class="form-control form-control-sm cash-pay" value="0.00"></td>
                <td class="balance-amount">${formatAmount(overdue)}</td>
                <td><button type="button" class="btn btn-sm btn-danger remove-row"><i class="uil uil-trash"></i></button></td>
              </tr>`;
            $("#invoiceBody").append(row);
          });
          $("#finalTotal").val(formatAmount(subTotal));
          $("#grandTotal").val(formatAmount(subTotal));
          $("#disTotal").val(formatAmount(0));
        } else {
          $("#invoiceBody").html(
            `<tr><td colspan="11" class="text-center text-muted">No items found</td></tr>`
          );
          $("#finalTotal, #grandTotal, #disTotal").val("0.00");
          swal("No Data", "No invoices found for this customer.", "info");
        }
        updateState();
        toggleCashPay();
      },
      error: function (xhr) {
        console.error("Failed to fetch invoices", xhr);
        swal("Error", "Failed to load invoices. Please try again.", "error");
      },
    });
  }

  $("#cash_total").on("input", function () {
    toggleCashPay();
    updateState();
  });

  $("#invoiceBody").on(
    "input",
    ".cash-pay",
    debounce(function () {
      const $input = $(this);
      const $row = $input.closest("tr");
      validateCashPayment($input, $row);
      updateRowBalance($row);
      updateState($row);
    }, 300)
  );

  $("#utilize").on("click", function (e) {
    e.preventDefault();
    const chequeBalance = parseAmount($("#cheque_balance").val());
    const cashBalance = parseAmount($("#cash_balance").val());
    if (chequeBalance <= 0 && cashBalance <= 0) {
      swal({
        title: "No Balance Available!",
        html: "Please add cheque or cash amount before making payments.",
        type: "error",
        timer: CONFIG.SWAL_TIMEOUT,
        showConfirmButton: false,
        allowOutsideClick: false,
        showCloseButton: true,
        timerProgressBar: true,
      });
      return;
    }
    if (chequeBalance > 0 || cashBalance > 0) {
      swal("Unused Balance Detected", "Please utilize the remaining cheque or cash balance.", "info");
    }

    const $invoiceBody = $("#invoiceBody");
    const $invoiceRows = $invoiceBody.find("tr").not("#noItemRow");
    const $utilizationBody = $("#utilizationBody");
    $utilizationBody.empty();

    if ($invoiceRows.length === 0) {
      $utilizationBody.html(
        `<tr class="no-data"><td colspan="6" class="text-center text-muted">No payment data available</td></tr>`
      );
      swal("No Payments", "There is no payment data to show in the summary.", "warning");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    let rowsAppended = 0;

    $invoiceRows.each(function () {
      const $row = $(this);
      const invNo = $row.find("td").eq(1).text().trim();
      const invDate = $row.find("td").eq(0).text().trim();
      const chequePay = parseAmount($row.find(".cheque-pay").val());
      const cashPay = parseAmount($row.find(".cash-pay").val());
      const totalAmount = chequePay + cashPay;

      if (totalAmount <= 0) return true;

      const payType = chequePay > 0 && cashPay > 0 ? "Cheque + Cash" : chequePay > 0 ? "Cheque" : "Cash";
      const invDateObj = new Date(invDate);
      const todayDateObj = new Date(today);
      const diffDays = Math.abs(Math.floor((invDateObj - todayDateObj) / (1000 * 60 * 60 * 24)));

      const rowHtml = `
        <tr>
          <td>${invNo}</td>
          <td>${invDate}</td>
          <td>${payType}</td>
          <td>${today}</td>
          <td>${formatAmount(totalAmount)}</td>
          <td>${diffDays}</td>
        </tr>`;
      $utilizationBody.append(rowHtml);
      rowsAppended++;
    });

    if (rowsAppended === 0) {
      $utilizationBody.html(
        `<tr class="no-data"><td colspan="6" class="text-center text-muted">No payment data available</td></tr>`
      );
      swal("No Payments", "There is no payment data to show in the summary.", "warning");
      return;
    }

    $("#utilization_summary").slideDown();
    $("#cash_total, #cheque_no, #cheque_date, #bank_branch_name, #amount").prop("disabled", true);
    $("#bank_branch_name").siblings("button").prop("disabled", true);
    $(".cheque-pay, .cash-pay").prop("disabled", true);
    $('button[data-bs-target="#customerModal"]').prop("disabled", true);
    $("#add_cheque").prop("disabled", true);
  });

  $("#new").click(function (e) {
    e.preventDefault();
    location.reload();
  });

  $("#create").click(function (event) {
    event.preventDefault();
    if (!$("#code").val()) {
      swal({
        title: "Error!",
        text: "Please enter receipt number",
        type: "error",
        timer: CONFIG.SWAL_TIMEOUT,
        showConfirmButton: false,
      });
      return;
    }
    if (!$("#customer_code").val()) {
      swal({
        title: "Error!",
        text: "Please select a customer",
        type: "error",
        timer: CONFIG.SWAL_TIMEOUT,
        showConfirmButton: false,
      });
      return;
    }
    if (!$("#entry_date").val()) {
      swal({
        title: "Error!",
        text: "Please select an entry date",
        type: "error",
        timer: CONFIG.SWAL_TIMEOUT,
        showConfirmButton: false,
      });
      return;
    }

    $(".someBlock").preloader();
    const formData = new FormData($("#form-data")[0]);
    const formDataCheque = new FormData($("#form-data-cheque")[0]);
    const formDataInvoice = new FormData($("#form-data-invoice")[0]);

    formData.append("grandTotal", parseAmount($("#grandTotal").val()));
    formData.append("customer_id", $("#customer_id").val());
    formDataCheque.forEach((value, key) => formData.append(key, value));
    formDataInvoice.forEach((value, key) => formData.append(key, value));
    formData.append("create", true);
    formData.append("action", "create");

    $.ajax({
      url: "ajax/php/payment-receipt.php",
      type: "POST",
      data: formData,
      async: false,
      cache: false,
      contentType: false,
      processData: false,
      success: function (result) {
        $(".someBlock").preloader("remove");
        if (result.status === "success") {
          swal({
            title: "Success!",
            text: "Payment receipt created successfully!",
            type: "success",
            timer: CONFIG.SWAL_TIMEOUT,
            showConfirmButton: false,
          });
          setTimeout(() => window.location.reload(), CONFIG.SWAL_TIMEOUT);
        } else {
          swal({
            title: "Error!",
            text: result.message || "Something went wrong.",
            type: "error",
            timer: CONFIG.SWAL_TIMEOUT,
            showConfirmButton: false,
          });
        }
      },
      error: function (xhr) {
        $(".someBlock").preloader("remove");
        swal("Error", "Failed to create payment receipt. Please try again.", "error");
      },
    });
  });

  // Initialize
  toggleCashPay();
});