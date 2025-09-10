<?php
require __DIR__ . '/_bootstrap.php';

$sql = "SELECT numero_bilhete, name, email, phone, `hora-data` AS hora_data
        FROM participants
        ORDER BY numero_bilhete";
$rows = $pdo->query($sql)->fetchAll();
out(true, $rows);
