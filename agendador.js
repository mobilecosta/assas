//arquivo responsável por dar partida no index.js (responsável peça integração) a cada 5 minutos.

const { exec } = require("child_process");
const { stdout, stderr } = require("process");

const INTERVALO = 60 * 1000; //1 minuto 

function executarIntegracao() {
    console.log("Executando a integração SUPABASE + ASAAS");

    exec("node index.js", (erro, stdout, stderr) => {
        if (erro) {
            console.log("Erro ao executar index.js:", erro.message);
            return;        
        }
        if (stderr) {
            console.error("Aviso:", stderr);
        }
        console.log("Resultado:", stdout);
        console.log(`Próxima execução em ${INTERVALO / 60000 } minutos...\n`);
    });
}

//executa
executarIntegracao();

//agenda para repetir
setInterval(executarIntegracao, INTERVALO);