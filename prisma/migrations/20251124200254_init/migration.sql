/*
  Warnings:

  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TituloReceber` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TituloReceber" DROP CONSTRAINT "TituloReceber_clienteId_fkey";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "TituloReceber";

-- CreateTable
CREATE TABLE "sfj0007000" (
    "a1_codcli" SERIAL NOT NULL,
    "sfj_nome" TEXT NOT NULL,
    "sfj_cpf_cnpj" TEXT NOT NULL,
    "sfj_cadastro" TIMESTAMP(3) NOT NULL,
    "sfj_tipo" INTEGER NOT NULL,
    "sfj_ddd" TEXT,
    "sfj_fone" TEXT,
    "sfj_email" TEXT,
    "sfj_perfil" TEXT,
    "sfj_situacao" INTEGER NOT NULL,

    CONSTRAINT "sfj0007000_pkey" PRIMARY KEY ("a1_codcli")
);

-- CreateTable
CREATE TABLE "se20007000" (
    "id" SERIAL NOT NULL,
    "se2_ender" TEXT NOT NULL,
    "se2_cep" TEXT NOT NULL,
    "se2_vigencia" TIMESTAMP(3) NOT NULL,
    "sz9_municipio" TEXT NOT NULL,
    "a1_codcli" INTEGER NOT NULL,

    CONSTRAINT "se20007000_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "san0007001" (
    "id" SERIAL NOT NULL,
    "an_vencto" TIMESTAMP(3) NOT NULL,
    "an_valor" DECIMAL(12,2) NOT NULL,
    "an_historico" TEXT,
    "an_codtit" TEXT NOT NULL,
    "an_emissao" TIMESTAMP(3) NOT NULL,
    "an_venctoreal" TIMESTAMP(3) NOT NULL,
    "a1_codcli" INTEGER NOT NULL,

    CONSTRAINT "san0007001_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "se20007000" ADD CONSTRAINT "se20007000_a1_codcli_fkey" FOREIGN KEY ("a1_codcli") REFERENCES "sfj0007000"("a1_codcli") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "san0007001" ADD CONSTRAINT "san0007001_a1_codcli_fkey" FOREIGN KEY ("a1_codcli") REFERENCES "sfj0007000"("a1_codcli") ON DELETE CASCADE ON UPDATE CASCADE;
