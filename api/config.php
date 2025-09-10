<?php
// api/config.php
$DB_HOST = '162.241.3.25';      // <- IP do seu MySQL no host
$DB_NAME = 'microcap_sorteio';  // <- nome do banco
$DB_USER = 'microcap_sorteio';  // <- usuário do banco
$DB_PASS = 'u8GM7k86hi1Iv';     // <- senha

$dsn = "mysql:host=$DB_HOST;port=3306;dbname=$DB_NAME;charset=utf8mb4";
$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES => false,
];

$pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
$pdo->exec("SET time_zone='-03:00'");
