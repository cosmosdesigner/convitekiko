// Preencher estes valores antes de partilhar o convite. Não é preciso alterar outros ficheiros.
export const party = {
  location: 'Rua Ribeiro da Silva, 1032, 1685-168 Famões',
  mapUrl: '', // Ex.: https://maps.google.com/?q=...
  whatsappNumber: '', // Número internacional sem + nem espaços. Ex.: 351912345678
}

export const whatsappUrl = party.whatsappNumber
  ? `https://wa.me/${party.whatsappNumber}?text=${encodeURIComponent('Olá! Confirmo a presença na festa dos 7 anos do Francisco, no dia 8 de novembro.')}`
  : ''
