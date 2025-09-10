<?php
// DEBUG (remova em produção)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Cabeçalhos e CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // depois restrinja para seu domínio
header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Se der QUALQUER erro/exception, devolve JSON (não HTML)
set_exception_handler(function($e){
  http_response_code(500);
  echo json_encode(['ok'=>false,'msg'=>$e->getMessage(),'type'=>get_class($e)]);
  exit;
});
set_error_handler(function($sev,$msg,$file,$line){
  http_response_code(500);
  echo json_encode(['ok'=>false,'msg'=>"$msg @ $file:$line"]);
  exit;
});

require __DIR__ . '/config.php';

function out($ok,$data=null,$msg=null,$code=200){
  http_response_code($code);
  echo json_encode(['ok'=>$ok,'data'=>$data,'msg'=>$msg], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}
