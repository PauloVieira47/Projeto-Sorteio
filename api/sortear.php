<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, null, 'Método inválido', 405);

try{
  $pdo->beginTransaction();

  // escolhe alguém que AINDA não está em 'sorteados'
  $row = $pdo->query("SELECT p.numero_bilhete
                      FROM participants p
                      LEFT JOIN sorteados s ON s.numero_sorteado = p.numero_bilhete
                      WHERE s.numero_sorteado IS NULL
                      ORDER BY RAND()
                      LIMIT 1")->fetch();

  if (!$row){ $pdo->rollBack(); out(false, null, 'Sem elegíveis', 400); }

  $num = (int)$row['numero_bilhete'];
  $pdo->prepare("INSERT INTO sorteados (numero_sorteado) VALUES (:n)")
      ->execute([':n'=>$num]);
  $id = (int)$pdo->lastInsertId();

  $pdo->commit();

  $q = $pdo->prepare("SELECT p.numero_bilhete, p.name, p.email, p.phone, s.`hora-data` AS hora_data
                      FROM sorteados s
                      JOIN participants p ON p.numero_bilhete = s.numero_sorteado
                      WHERE s.id = :id");
  $q->execute([':id'=>$id]);
  out(true, $q->fetch());
}catch(Throwable $t){
  if ($pdo->inTransaction()) $pdo->rollBack();
  out(false, null, 'Erro no sorteio', 500);
}
