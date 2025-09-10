<?php
require __DIR__ . '/_bootstrap.php';

$sql = "SELECT s.id, p.numero_bilhete, p.name, s.`hora-data` AS hora_data
        FROM sorteados s
        JOIN participants p ON p.numero_bilhete = s.numero_sorteado
        ORDER BY s.id DESC
        LIMIT 1";
$row = $pdo->query($sql)->fetch();
out(true, $row ?: null);
