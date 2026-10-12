// script.js
// Versao inicial: todo o trabalho acontece no navegador.
// A tarefa consiste em levar gerarDesenho para o servidor (Pages Functions)
// e fazer esta pagina apenas enviar o numero e exibir a resposta.


let idToken = "";
let svgAtual = "";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const loginStatus = document.getElementById("loginStatus");
const botaoBaixar = document.getElementById("baixar");

// O Google chama esta função quando o login é concluído.
window.handleGoogleCredential = function (resposta) {
    if (!resposta || !resposta.credential) {
        idToken = "";
        loginStatus.textContent = "Não foi possível confirmar o login.";
        return;
    }

    idToken = resposta.credential;
    loginStatus.textContent = "Login com Google realizado.";
    mensagem.textContent = "";
};

// Envia o número e o token para a função do servidor.
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    mensagem.textContent = "";
    area.replaceChildren();
    botaoBaixar.hidden = true;
    svgAtual = "";

    const numero = Number(campoNumero.value);

    if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
        mensagem.textContent =
            "Erro 400: digite um inteiro entre 1 e 100.";
        return;
    }

    if (!idToken) {
        mensagem.textContent =
            "Erro 401: faça login com sua conta Google.";
        return;
    }

    try {
        const resposta = await fetch("/api/desenho", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({ numero })
        });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));

            if (resposta.status === 400) {
                mensagem.textContent =
                    "Erro 400: " +
                    (erro.error || "número inválido.");
            } else if (resposta.status === 401) {
                mensagem.textContent =
                    "Erro 401: login inválido ou expirado. " +
                    "Entre novamente com o Google.";
                idToken = "";
                loginStatus.textContent =
                    "Faça login com o Google novamente.";
            } else if (resposta.status === 405) {
                mensagem.textContent =
                    "Erro 405: método de requisição não permitido.";
            } else {
                mensagem.textContent =
                    erro.error || "Não foi possível gerar o desenho.";
            }

            return;
        }

        const tipo = resposta.headers.get("Content-Type") || "";

        if (!tipo.toLowerCase().startsWith("image/svg+xml")) {
            mensagem.textContent =
                "O servidor não retornou um SVG válido.";
            return;
        }

        svgAtual = await resposta.text();

        // Exibe o SVG que veio do servidor.
        area.innerHTML = svgAtual;
        botaoBaixar.hidden = false;

    } catch (erro) {
        mensagem.textContent =
            "Falha de comunicação com o servidor. Tente novamente.";
    }
});

// Permite baixar a figura que o servidor gerou.
botaoBaixar.addEventListener("click", () => {
    if (!svgAtual) {
        return;
    }

    const arquivo = new Blob(
        [svgAtual],
        { type: "image/svg+xml" }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = "exemplo.svg";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
