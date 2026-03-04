<?php

class CompanyMaster
{

    public $id;
    public $name;
    public $code;
    public $address;
    public $contact_person;
    public $phone_number;
    public $email;
    public $is_active;
    public $remark;
    public $created_at;

    public function __construct($id = null)
    {
        if ($id) {
            $query = "SELECT * FROM `company_master` WHERE `id` = " . (int) $id;
            $db = new Database();
            $result = mysqli_fetch_array($db->readQuery($query));

            if ($result) {
                $this->id = $result['id'];
                $this->name = $result['name'];
                $this->code = $result['code'];
                $this->address = $result['address'];
                $this->contact_person = $result['contact_person'];
                $this->phone_number = $result['phone_number'];
                $this->email = $result['email'];
                $this->is_active = $result['is_active'];
                $this->remark = $result['remark'];
                $this->created_at = $result['created_at'];
            }
        }
    }

    public function create()
    {
        $query = "INSERT INTO `company_master` (
            `name`, `code`, `address`, `contact_person`, `phone_number`, `email`, `is_active`, `remark`
        ) VALUES (
            '$this->name', '$this->code', '$this->address', '$this->contact_person', '$this->phone_number', '$this->email', '$this->is_active', '$this->remark'
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
        $query = "UPDATE `company_master` SET 
            `name` = '$this->name',
            `code` = '$this->code',
            `address` = '$this->address',
            `contact_person` = '$this->contact_person',
            `phone_number` = '$this->phone_number',
            `email` = '$this->email',   
            `is_active` = '$this->is_active',
            `remark` = '$this->remark'
            WHERE `id` = '$this->id'";

        $db = new Database();
        $result = $db->readQuery($query);

        if ($result) {
            return true;
        } else {
            return false;
        }
    }

    public function delete()
    {
        $query = "DELETE FROM `company_master` WHERE `id` = '$this->id'";
        $db = new Database();
        return $db->readQuery($query);
    }

    public function all()
    {
        $query = "SELECT * FROM `company_master` ORDER BY name ASC";
        $db = new Database();
        $result = $db->readQuery($query);

        $array_res = array();
        while ($row = mysqli_fetch_array($result)) {
            array_push($array_res, $row);
        }

        return $array_res;
    }

    public function getActiveCompany()
    {
        $query = "SELECT * FROM `company_master` WHERE `is_active` = 1 ORDER BY `id` ASC";
        $db = new Database();
        $result = $db->readQuery($query);
        $array = [];

        while ($row = mysqli_fetch_array($result)) {
            array_push($array, $row);
        }

        return $array;
    }

    public function getLastID()
    {
        $query = "SELECT * FROM `company_master` ORDER BY `id` DESC LIMIT 1";
        $db = new Database();
        $result = mysqli_fetch_array($db->readQuery($query));
        return $result['id'];
    }
}

?>