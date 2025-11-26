#!/bin/bash

echo "Iniciando o servidor e o frontend com logs visíveis..."

# Verifica se o arquivo .env existe. Se não existir, copia do .env.example
if [ ! -f server/.env ]; then
    echo "Criando server/.env a partir de server/.env.example. Por favor, edite-o com suas credenciais."
    cp server/.env.example server/.env
fi

# Roda o script 'start' do package.json raiz usando concurrently
npm start

echo "Processos encerrados."