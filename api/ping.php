<?php
require __DIR__ . '/_bootstrap.php';
$info = $pdo->query("SELECT DATABASE() db, @@hostname host, @@port port")->fetch();
$tot  = $pdo->query("SELECT COUNT(*) c FROM participants")->fetchColumn();
out(true, ['db'=>$info['db'], 'mysql_host'=>$info['host'], 'mysql_port'=>$info['port'], 'participants'=>(int)$tot]);
