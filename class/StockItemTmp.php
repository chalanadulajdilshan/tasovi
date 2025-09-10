<?php

class StockItemTmp
{
    public $id;
    public $arn_id;
    public $item_id;
    public $qty;
    public $cost;
    public $department_id;
    public $list_price;
    public $invoice_price;
    public $created_at;
    public $status;

    public function __construct($id = null)
    {
        if ($id) {
            $query = "SELECT * FROM `stock_item_tmp` WHERE `id` = " . (int) $id;
            $db = new Database();
            $result = mysqli_fetch_array($db->readQuery($query));

            if ($result) {
                foreach ($result as $key => $value) {
                    $this->$key = $value;
                }
            }
        }
    }

    public function create()
    {
        $query = "INSERT INTO `stock_item_tmp` (
            `arn_id`, `item_id`, `qty`, `cost`, `list_price`,`invoice_price`, `department_id`, `created_at`
        ) VALUES (
            '{$this->arn_id}', '{$this->item_id}', '{$this->qty}', '{$this->cost}',
            '{$this->list_price}','{$this->invoice_price}', '{$this->department_id}', NOW()
        )";

        $db = new Database();
        $result = $db->readQuery($query);

        if ($result) {
            return mysqli_insert_id($db->DB_CON);
        } else {
            return false;
        }
    }

    public function update()
    {
        $query = "UPDATE `stock_item_tmp` SET
            `arn_id` = '{$this->arn_id}',
            `item_id` = '{$this->item_id}',
            `qty` = '{$this->qty}',
            `cost` = '{$this->cost}',
            `department_id` = '{$this->department_id}',
            `list_price` = '{$this->list_price}',
            `invoice_price` = '{$this->invoice_price}'
        WHERE `id` = '{$this->id}'";

        $db = new Database();
        $result = $db->readQuery($query);

        if ($result) {
            return $this->__construct($this->id);
        } else {
            return false;
        }
    }

    public function delete()
    {
        $query = "DELETE FROM `stock_item_tmp` WHERE `id` = '{$this->id}'";
        $db = new Database();
        return $db->readQuery($query);
    }

    public function all()
    {
        $query = "SELECT * FROM `stock_item_tmp` ORDER BY `id` DESC";
        $db = new Database();
        $result = $db->readQuery($query);

        $array_res = array();
        while ($row = mysqli_fetch_array($result)) {
            array_push($array_res, $row);
        }

        return $array_res;
    }

    public function getByArnId($arn_id)
    {
        $query = "SELECT * FROM `stock_item_tmp` WHERE `arn_id` = '" . (int) $arn_id . "'";
        $db = new Database();
        $result = $db->readQuery($query);

        $array_res = array();
        while ($row = mysqli_fetch_array($result)) {
            array_push($array_res, $row);
        }

        return $array_res;
    }
    public function getByItemId($id)
    {
        $query = "SELECT sit.* 
                 FROM `stock_item_tmp` sit
                 INNER JOIN `arn_master` am ON sit.arn_id = am.id
                 WHERE sit.`item_id` = '" . (int) $id . "' 
                 AND (am.is_cancelled IS NULL OR am.is_cancelled = 0)";

        $db = new Database();
        $result = $db->readQuery($query);

        $array_res = array();
        while ($row = mysqli_fetch_array($result)) {
            array_push($array_res, $row);
        }

        return $array_res;
    }

    public function getByItemIdAndDepartment($id, $department_id)
    {
        $query = "SELECT * FROM `stock_item_tmp` WHERE `item_id` = '" . (int) $id . "' AND `department_id` = '" . (int) $department_id . "' ";
        $db = new Database();
        $result = $db->readQuery($query);

        $array_res = array();
        while ($row = mysqli_fetch_array($result)) {
            $array_res[] = $row;
        }

        return $array_res;
    }



    /**
     * Move quantity between departments using FIFO across non-cancelled ARN lots.
     * Keeps stock_item_tmp aligned with inter-department transfers.
     */
    public function transferBetweenDepartments($item_id, $from_department_id, $to_department_id, $transfer_qty)
    {
        $db = new Database();

        $item_id = (int)$item_id;
        $from_department_id = (int)$from_department_id;
        $to_department_id = (int)$to_department_id;
        $remaining = (float)$transfer_qty;

        if ($remaining <= 0) {
            return true;
        }

        // Fetch FIFO lots from source department, excluding cancelled ARNs
        $query = "
            SELECT sit.*
            FROM stock_item_tmp sit
            INNER JOIN arn_master am ON am.id = sit.arn_id
            WHERE sit.item_id = {$item_id}
              AND sit.department_id = {$from_department_id}
              AND (am.is_cancelled IS NULL OR am.is_cancelled = 0)
              AND sit.qty > 0
            ORDER BY sit.created_at ASC, sit.id ASC
        ";
        $result = $db->readQuery($query);

        while ($remaining > 0 && ($lot = mysqli_fetch_assoc($result))) {
            $movable = min($remaining, (float)$lot['qty']);

            // 1) Deduct from source lot
            $newQty = (float)$lot['qty'] - $movable;
            $updateSrc = "UPDATE stock_item_tmp SET qty = '" . $newQty . "' WHERE id = " . (int)$lot['id'];
            $db->readQuery($updateSrc);

            // 2) Add to destination department lot with same ARN and pricing (upsert by arn_id+item+department)
            $destFind = "SELECT id, qty FROM stock_item_tmp WHERE arn_id = " . (int)$lot['arn_id'] . " AND item_id = {$item_id} AND department_id = {$to_department_id} LIMIT 1";
            $destRes = $db->readQuery($destFind);
            if ($destRow = mysqli_fetch_assoc($destRes)) {
                $destNewQty = (float)$destRow['qty'] + $movable;
                $updateDest = "UPDATE stock_item_tmp SET qty = '" . $destNewQty . "' WHERE id = " . (int)$destRow['id'];
                $db->readQuery($updateDest);
            } else {
                $insertDest = "INSERT INTO stock_item_tmp (arn_id, item_id, qty, cost, list_price, invoice_price, department_id, created_at) VALUES ('" . (int)$lot['arn_id'] . "', '{$item_id}', '" . $movable . "', '" . (float)$lot['cost'] . "', '" . (float)$lot['list_price'] . "', '" . (float)$lot['invoice_price'] . "', '{$to_department_id}', NOW())";
                $db->readQuery($insertDest);
            }

            $remaining -= $movable;
        }

        // If we couldn't move full quantity due to lack of FIFO lots, return false
        return $remaining <= 0;
    }

    public function updateStockItemTmpPrice($id, $field, $value)
    {
        $allowedFields = ['cost', 'invoice_price', 'list_price'];

        if (!in_array($field, $allowedFields)) {
            return ['error' => 'Invalid field'];
        }

        if (!is_numeric($value)) {
            return ['error' => 'Value must be numeric'];
        }

        $value = floatval($value);

        if (in_array($field, ['cash_dis', 'credit_dis']) && ($value < 0 || $value > 100)) {
            return ['error' => 'Discount must be between 0 and 100'];
        }

        $db = new Database();
        $value = mysqli_real_escape_string($db->DB_CON, $value);
        $id = (int) $id;

        $query = "UPDATE `stock_item_tmp` SET `$field` = '$value' WHERE `id` = $id";

        $result = $db->readQuery($query);

        if ($result) {
            return ['success' => true];
        } else {
            return ['error' => 'Database update failed'];
        }
    }

    public function updateQtyByArnId($arn_id, $item_id, $department_id, $qty_change)
    {
        $db = new Database();

        // 1. Get the current quantity
        $selectQuery = "SELECT `qty` FROM `stock_item_tmp` 
                    WHERE `arn_id` = '{$arn_id}' 
                      AND `item_id` = '{$item_id}' 
                      AND `department_id` = '{$department_id}' 
                    LIMIT 1";


        $result = $db->readQuery($selectQuery);

        if ($row = mysqli_fetch_assoc($result)) {
            $currentQty = (float)$row['qty'];


            $newQty = $currentQty + $qty_change;


            if ($newQty < 0) {
                return false;
            }

            // 3. Update with new quantity
            $updateQuery = "UPDATE `stock_item_tmp` SET 
                            `qty` = '{$newQty}' 
                        WHERE `arn_id` = '{$arn_id}' 
                          AND `item_id` = '{$item_id}' 
                          AND `department_id` = '{$department_id}'";

            $updateResult = $db->readQuery($updateQuery);

            return $updateResult ? true : false;
        }

        // Record not found
        return false;
    }
}
