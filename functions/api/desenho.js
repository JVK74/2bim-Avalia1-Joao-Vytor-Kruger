
import {
    gerarDesenho,
    numeroValido
} from "../../lib/desenho.js";

function respostaJson(status, mensagem) {
    return new Response(
        JSON.stringify({ error: mensagem }),
        {
            status,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store"
            }
        }
    );
}

export async function onRequest({ request, env }) {
    // 1. Verifica o método HTTP.
    if (request.method !== "POST") {
        return respostaJson(
            405,
            "Método não permitido. Utilize POST."
        );
    }

    // 2. Verifica se o corpo existe e contém JSON válido.
    let texto;
    let dados;

    try {
        texto = await request.text();
    } catch {
        return respostaJson(400, "Não foi possível ler o corpo.");
    }

    if (!texto.trim()) {
        return respostaJson(400, "Corpo da requisição ausente.");
    }

    try {
        dados = JSON.parse(texto);
    } catch {
        return respostaJson(400, "JSON inválido.");
    }

    if (
        !dados ||
        typeof dados !== "object" ||
        Array.isArray(dados) ||
        !Object.prototype.hasOwnProperty.call(dados, "numero") ||
        !numeroValido(dados.numero)
    ) {
        return respostaJson(
            400,
            "O número deve ser um inteiro entre 1 e 100."
        );
    }

    // 3. Verifica o token de identidade do Google.
    const autorizacao = request.headers.get("Authorization") || "";
    const correspondencia = autorizacao.match(/^Bearer\s+(\S+)$/i);

    if (!correspondencia) {
        return respostaJson(
            401,
            "Token ausente ou inválido."
        );
    }

    if (!env.GOOGLE_CLIENT_ID) {
        return respostaJson(
            500,
            "A variável GOOGLE_CLIENT_ID não está configurada."
        );
    }

    const token = correspondencia[1];

    let respostaGoogle;
    let informacoes;

    try {
        const url =
            "https://oauth2.googleapis.com/tokeninfo?id_token=" +
            encodeURIComponent(token);

        respostaGoogle = await fetch(url);

        if (!respostaGoogle.ok) {
            return respostaJson(401, "Token Google inválido ou expirado.");
        }

        informacoes = await respostaGoogle.json();
    } catch {
        return respostaJson(401, "Não foi possível validar o token.");
    }

    // Confere se o token pertence ao nosso aplicativo
    // e se o Google confirmou o e-mail.
    if (
        informacoes.aud !== env.GOOGLE_CLIENT_ID ||
        informacoes.email_verified !== "true" ||
        typeof informacoes.email !== "string" ||
        !informacoes.email.trim()
    ) {
        return respostaJson(
            401,
            "Token inválido ou e-mail não verificado."
        );
    }

    // O e-mail vem das informações validadas pelo Google.
    // O usuário não consegue escolhê-lo pelo formulário.
    const email = informacoes.email;

    const svg = gerarDesenho(dados.numero, email);

    return new Response(svg, {
        status: 200,
        headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-store"
        }
    });
}
