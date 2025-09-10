<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, null, 'Método inválido', 405);

$in    = json_decode(file_get_contents('php://input'), true) ?? [];
$name  = trim($in['name']  ?? '');
$email = trim($in['email'] ?? '');
$phone = preg_replace('/\D+/', '', $in['phone'] ?? '');

if (mb_strlen($name) < 3) out(false, null, 'Nome inválido', 400);
$email = ($email !== '') ? mb_strtolower($email) : null;
$phone = ($phone !== '') ? $phone : null;

/* 1) Verificar duplicado sem repetir placeholders */
if ($email !== null || $phone !== null) {
  $conds  = [];
  $params = [];
  if ($email !== null) { $conds[] = 'email = :email'; $params[':email'] = $email; }
  if ($phone !== null) { $conds[] = 'phone = :phone'; $params[':phone'] = $phone; }

  $sql = 'SELECT numero_bilhete FROM participants WHERE ' . implode(' OR ', $conds) . ' LIMIT 1';
  $st  = $pdo->prepare($sql);
  $st->execute($params);
  $num = $st->fetchColumn();
  if ($num) {
    out(true, ['numero_bilhete' => (int)$num, 'existed' => true]);
  }
}

/* 2) Inserir novo */
$st = $pdo->prepare('INSERT INTO participants (name, email, phone) VALUES (:n, :e, :p)');
$st->execute([':n' => $name, ':e' => $email, ':p' => $phone]);

out(true, ['numero_bilhete' => (int)$pdo->lastInsertId(), 'existed' => false]);
