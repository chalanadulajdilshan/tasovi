<?php
header('Content-Type: application/json');
require_once('../../class/Database.php');
require_once('../../class/InvoicePayments.php');

// Initialize response array
$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => []
];

try {
    // Check if the request is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get the action
    $action = $_POST['action'] ?? '';

    if ($action === 'get_outstanding_report') {
        $filterType = $_POST['filter_type'] ?? '';
        $customerId = $_POST['customer_id'] ?? '';
        $fromDate = $_POST['from_date'] ?? '';
        $toDate = $_POST['to_date'] ?? '';

        // Validate required fields based on filter type
        if (($filterType === 'customer' && empty($customerId)) ||
            ($filterType === 'date' && (empty($fromDate) || empty($toDate)))
        ) {
            throw new Exception('Missing required parameters');
        }

        $db = new Database();

        // Build the base query for sales invoices
        $query = "SELECT 
                    si.invoice_no,
                    si.invoice_date,
                    si.customer_name,
                    si.grand_total as invoice_amount,
                    COALESCE(si.outstanding_settle_amount, 0) as paid_amount,
                    (si.grand_total - COALESCE(si.outstanding_settle_amount, 0)) as outstanding
                  FROM 
                    sales_invoice si
                  WHERE 
                    si.status = 'active' AND
                    si.grand_total > 0 AND
                    si.payment_type = 2";  // Only show credit invoices (payment_type = 2)

        // Add conditions based on filter type
        if ($filterType === 'customer') {
            $query .= " AND si.customer_id = " . (int)$customerId;
        } else if ($filterType === 'date') {
            // Ensure the date format is correct and use the same column name as in SELECT
            $query .= " AND si.invoice_date BETWEEN '" . $db->escapeString($fromDate) . " 00:00:00' AND '" . $db->escapeString($toDate) . " 23:59:59'";
        }

        $query .= " ORDER BY si.invoice_date DESC"; // Add sorting by date

        $result = $db->readQuery($query);
        if (!$result) {
            throw new Exception('Error executing query: ' . mysqli_error($db->DB_CON));
        }
        $data = [];

        while ($row = mysqli_fetch_assoc($result)) {
            // Add invoice data to results
            $data[] = [
                'invoice_no' => $row['invoice_no'],
                'invoice_date' => $row['invoice_date'],
                'customer_name' => $row['customer_name'],
                'invoice_amount' => (float)$row['invoice_amount'],
                'paid_amount' => (float)$row['paid_amount'],
                'outstanding' => (float)$row['outstanding']
            ];
        }

        $response = [
            'status' => 'success',
            'message' => 'Data retrieved successfully',
            'data' => $data
        ];
    } else {
        throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => $e->getMessage(),
        'data' => []
    ];
}

echo json_encode($response);
