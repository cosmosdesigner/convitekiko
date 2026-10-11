// Alterar a morada aqui atualiza o convite e a pesquisa no mapa.
const address = 'Rua Ribeiro da Silva, 1032, 1685-168 Famões'

export const party = {
  location: address,
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Portugal`)}`,
  whatsappNumber: '', // Número internacional sem + nem espaços. Ex.: 351912345678
}

export const whatsappUrl = party.whatsappNumber
  ? `https://wa.me/${party.whatsappNumber}?text=${encodeURIComponent('Olá! Confirmo a presença na festa dos 7 anos do Francisco, no dia 8 de novembro.')}`
  : ''
