import type { Lang } from '../i18n/translations';

type Section = { title: string; body: string[] };

type LegalDoc = { title: string; updated: string; sections: Section[] };

export const legalDocs: Record<Lang, Record<'terms' | 'privacy' | 'aup' | 'safety', LegalDoc>> = {
  en: {
    terms: {
      title: 'Terms of Service',
      updated: 'June 2026',
      sections: [
        {
          title: '1. Operator & Service',
          body: [
            'FLUXGRID is operated from Brazil and offered internationally. By using FLUXGRID you agree to these Terms.',
            'FLUXGRID is an anonymous public messaging service. No account is required. Messages are public and may be visible to anyone with or without a channel ID.',
            'You must be 18 years or older to use this service.',
          ],
        },
        {
          title: '2. Acceptable Conduct',
          body: [
            'You agree not to post illegal content, including child sexual abuse material, grooming, trafficking, credible threats, non-consensual intimate imagery, or content that violates applicable law.',
            'Do not post personal information (names, addresses, phone numbers) that could identify you or others.',
            'We may remove content, block channels, and preserve minimal technical data when required by law or safety obligations.',
          ],
        },
        {
          title: '3. No Warranty',
          body: [
            'FLUXGRID is provided "as is." We do not guarantee anonymity against all technical or legal identification methods.',
            'We recommend using a VPN. Users are responsible for their own compliance with local laws.',
          ],
        },
        {
          title: '4. Paid Features',
          body: [
            'Paid tiers (vanity IDs, perks, FLUX deep void, media) are governed by separate commercial terms. All tier payments are Bitcoin only — no cards or bank accounts. FLUX buries messages mid-feed with optional burn timers for maximum anonymity.',
            'Refunds are governed by our Refund Policy at purchase.',
          ],
        },
        {
          title: '5. Limitation of Liability',
          body: [
            'To the maximum extent permitted by law, FLUXGRID and its operator are not liable for user-generated content or indirect damages.',
            'Brazilian law may apply to the operator; international users accept cross-border data processing for security and legal compliance.',
          ],
        },
        {
          title: '6. Changes',
          body: ['We may update these Terms. Continued use after changes constitutes acceptance.'],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      updated: 'June 2026',
      sections: [
        {
          title: '1. Data Controller',
          body: [
            'FLUXGRID is operated from Brazil. Contact: privacy@fluxgrid.app',
            'We follow LGPD (Lei Geral de Proteção de Dados) principles and applicable international privacy standards.',
          ],
        },
        {
          title: '2. What We Process',
          body: [
            'Public messages: channel ID, message text, timestamp.',
            'Short-lived IP addresses for abuse prevention (retained up to 72 hours, not stored in message records).',
            'Minimal security logs (retained up to 90 days).',
            'Abuse reports: message ID, category, optional note, timestamp.',
            'Paid tier: Bitcoin payment only; we receive wallet transaction reference, not identity or bank data.',
          ],
        },
        {
          title: '3. What We Do NOT Collect',
          body: [
            'No accounts, usernames, passwords, or mandatory email.',
            'No advertising profiles or sale of personal data.',
            'No long-term identity tracking across sessions.',
          ],
        },
        {
          title: '4. Legal Bases (LGPD / GDPR)',
          body: [
            'Legitimate interest: hosting public messages, abuse prevention, security.',
            'Legal obligation: CSAM reporting (e.g., NCMEC CyberTipline), law enforcement requests under valid legal process.',
            'Contract: paid tier fulfillment.',
          ],
        },
        {
          title: '5. Your Rights',
          body: [
            'You may request deletion of messages if you have the delete token issued at post time.',
            'Contact privacy@fluxgrid.app for LGPD/GDPR requests. We respond within applicable legal timeframes.',
            'We cannot verify authorship of anonymous posts without a delete token.',
          ],
        },
        {
          title: '6. International Transfers',
          body: [
            'Data may be processed on servers outside Brazil. We use appropriate safeguards for cross-border transfers.',
          ],
        },
        {
          title: '7. Children',
          body: [
            'FLUXGRID is not directed at anyone under 18. We do not knowingly collect data from minors.',
          ],
        },
      ],
    },
    aup: {
      title: 'Acceptable Use Policy',
      updated: 'June 2026',
      sections: [
        {
          title: 'Prohibited Content — Zero Tolerance',
          body: [
            'Child sexual abuse material (CSAM) — reported to NCMEC CyberTipline and authorities.',
            'Grooming, enticement, or exploitation of minors.',
            'Human trafficking or sexual exploitation.',
            'Credible threats of violence.',
            'Non-consensual intimate imagery.',
            'Terrorism propaganda or incitement.',
            'Doxxing: posting others\' personal information to cause harm.',
          ],
        },
        {
          title: 'Prohibited Conduct',
          body: [
            'Spam, phishing, malware links, fraud.',
            'Impersonation of government, brands, or individuals for deception.',
            'Posting your own or others\' identifying personal information.',
            'Circumventing safety systems or rate limits.',
          ],
        },
        {
          title: 'Enforcement',
          body: [
            'Content removal, channel blocks, IP/session blocks.',
            'Preservation of evidence for legal reporting (up to 90 days when required).',
            'Cooperation with law enforcement under valid legal process.',
          ],
        },
        {
          title: 'Media (Paid Tiers Only)',
          body: [
            'Images and video only on paid tiers with hash-matching before publication.',
            'Paid media is linked to Bitcoin transaction records — wallet address only, no identity on file.',
            'Illegal media results in immediate removal and reporting.',
          ],
        },
      ],
    },
    safety: {
      title: 'Safety Center',
      updated: 'June 2026',
      sections: [
        {
          title: 'Report Abuse',
          body: [
            'Use the REPORT button on any message in the feed.',
            'Email: abuse@fluxgrid.app',
            'CSAM and credible threats are prioritized for immediate review.',
          ],
        },
        {
          title: 'Child Safety',
          body: [
            'FLUXGRID is 18+ only.',
            'Apparent CSAM is reported to NCMEC CyberTipline (US) and relevant authorities including SaferNet Brazil when applicable.',
            'We preserve minimal metadata for 90 days when a CyberTipline report is filed, as required by law.',
          ],
        },
        {
          title: 'Protect Yourself',
          body: [
            'Use a VPN (free VPN is acceptable).',
            'Never share your real name, address, school, or workplace.',
            'Share channel IDs in person only with people you trust.',
            'Remember: all text messages are public.',
          ],
        },
        {
          title: 'Law Enforcement',
          body: [
            'Legal requests: legal@fluxgrid.app',
            'We retain minimal data. We produce available data only under valid legal process.',
            'Emergency disclosures only as permitted by applicable law.',
          ],
        },
        {
          title: 'NCMEC & International',
          body: [
            'US: National Center for Missing & Exploited Children — CyberTipline.org',
            'Brazil: SaferNet — www.safernet.org.br',
            'EU: INHOPE network — www.inhope.org',
          ],
        },
      ],
    },
  },
  pt: {
    terms: {
      title: 'Termos de Serviço',
      updated: 'Junho 2026',
      sections: [
        {
          title: '1. Operador e Serviço',
          body: [
            'FLUXGRID é operado do Brasil e oferecido internacionalmente. Ao usar o FLUXGRID você concorda com estes Termos.',
            'FLUXGRID é um serviço público de mensagens anônimas. Não é necessária conta. As mensagens são públicas.',
            'Você deve ter 18 anos ou mais para usar este serviço.',
          ],
        },
        {
          title: '2. Conduta Aceitável',
          body: [
            'Você concorda em não publicar conteúdo ilegal, incluindo material de abuso sexual infantil, aliciamento, tráfico, ameaças críveis ou imagens íntimas não consensuais.',
            'Não publique informações pessoais que possam identificar você ou outros.',
            'Podemos remover conteúdo, bloquear canais e preservar dados técnicos mínimos quando exigido por lei.',
          ],
        },
        {
          title: '3. Sem Garantia',
          body: [
            'FLUXGRID é fornecido "como está." Recomendamos o uso de VPN. Os usuários são responsáveis pelo cumprimento das leis locais.',
          ],
        },
        {
          title: '4. Recursos Pagos',
          body: [
            'Planos pagos (IDs personalizados, benefícios, mídia) têm termos comerciais separados. Uploads de mídia em planos pagos estão vinculados ao processamento de pagamento.',
          ],
        },
        {
          title: '5. Limitação de Responsabilidade',
          body: [
            'Na máxima extensão permitida por lei, FLUXGRID não é responsável por conteúdo gerado por usuários.',
            'A lei brasileira pode aplicar-se ao operador; usuários internacionais aceitam processamento transfronteiriço para segurança e conformidade legal.',
          ],
        },
        {
          title: '6. Alterações',
          body: ['Podemos atualizar estes Termos. O uso continuado após alterações constitui aceitação.'],
        },
      ],
    },
    privacy: {
      title: 'Política de Privacidade',
      updated: 'Junho 2026',
      sections: [
        {
          title: '1. Controlador de Dados',
          body: [
            'FLUXGRID é operado do Brasil. Contato: privacy@fluxgrid.app',
            'Seguimos os princípios da LGPD e padrões internacionais de privacidade aplicáveis.',
          ],
        },
        {
          title: '2. O Que Processamos',
          body: [
            'Mensagens públicas: ID do canal, texto, data/hora.',
            'Endereços IP de curta duração para prevenção de abuso (até 72 horas).',
            'Logs mínimos de segurança (até 90 dias).',
            'Denúncias de abuso: ID da mensagem, categoria, timestamp.',
            'Plano pago: pagamento processado por terceiros; recebemos apenas referência da transação.',
          ],
        },
        {
          title: '3. O Que NÃO Coletamos',
          body: [
            'Sem contas, nomes de usuário, senhas ou e-mail obrigatório.',
            'Sem perfis publicitários ou venda de dados pessoais.',
            'Sem rastreamento de identidade de longo prazo.',
          ],
        },
        {
          title: '4. Bases Legais (LGPD)',
          body: [
            'Interesse legítimo: hospedagem de mensagens públicas, prevenção de abuso, segurança.',
            'Obrigação legal: denúncia de CSAM, solicitações de autoridades com processo legal válido.',
            'Contrato: cumprimento de planos pagos.',
          ],
        },
        {
          title: '5. Seus Direitos',
          body: [
            'Você pode solicitar exclusão de mensagens com o token de exclusão emitido ao publicar.',
            'Contato: privacy@fluxgrid.app para solicitações LGPD. Respondemos nos prazos legais.',
          ],
        },
        {
          title: '6. Transferências Internacionais',
          body: ['Dados podem ser processados em servidores fora do Brasil com salvaguardas apropriadas.'],
        },
        {
          title: '7. Menores',
          body: ['FLUXGRID não é destinado a menores de 18 anos. Não coletamos dados de menores conscientemente.'],
        },
      ],
    },
    aup: {
      title: 'Política de Uso Aceitável',
      updated: 'Junho 2026',
      sections: [
        {
          title: 'Conteúdo Proibido — Tolerância Zero',
          body: [
            'Material de abuso sexual infantil (CSAM) — denunciado ao NCMEC CyberTipline e autoridades.',
            'Aliciamento ou exploração de menores.',
            'Tráfico humano ou exploração sexual.',
            'Ameaças críveis de violência.',
            'Imagens íntimas não consensuais.',
            'Propaganda terrorista ou incitação.',
            'Doxxing: publicar dados pessoais de terceiros para causar dano.',
          ],
        },
        {
          title: 'Conduta Proibida',
          body: [
            'Spam, phishing, links maliciosos, fraude.',
            'Falsificação de identidade de governo, marcas ou pessoas.',
            'Publicação de informações pessoais identificáveis.',
            'Contornar sistemas de segurança ou limites de taxa.',
          ],
        },
        {
          title: 'Aplicação',
          body: [
            'Remoção de conteúdo, bloqueio de canais, bloqueio de IP/sessão.',
            'Preservação de evidências para denúncias legais (até 90 dias quando exigido).',
            'Cooperação com autoridades mediante processo legal válido.',
          ],
        },
        {
          title: 'Mídia (Apenas Planos Pagos)',
          body: [
            'Imagens e vídeo apenas em planos pagos com verificação de hash antes da publicação.',
            'Mídia paga está vinculada a registros de pagamento — não é totalmente anônima.',
          ],
        },
      ],
    },
    safety: {
      title: 'Central de Segurança',
      updated: 'June 2026',
      sections: [
        {
          title: 'Denunciar Abuso',
          body: [
            'Use o botão DENUNCIAR em qualquer mensagem.',
            'E-mail: abuse@fluxgrid.app',
            'CSAM e ameaças críveis têm prioridade imediata.',
          ],
        },
        {
          title: 'Proteção Infantil',
          body: [
            'FLUXGRID é apenas para maiores de 18 anos.',
            'CSAM aparente é denunciado ao NCMEC CyberTipline e autoridades incluindo SaferNet Brasil.',
          ],
        },
        {
          title: 'Proteja-se',
          body: [
            'Use uma VPN (VPN gratuita é aceitável).',
            'Nunca compartilhe nome real, endereço, escola ou local de trabalho.',
            'Todas as mensagens de texto são públicas.',
          ],
        },
        {
          title: 'Autoridades',
          body: [
            'Solicitações legais: legal@fluxgrid.app',
            'Retemos dados mínimos. Produzimos dados disponíveis apenas mediante processo legal válido.',
          ],
        },
        {
          title: 'NCMEC e Internacional',
          body: [
            'EUA: NCMEC CyberTipline — CyberTipline.org',
            'Brasil: SaferNet — www.safernet.org.br',
            'UE: INHOPE — www.inhope.org',
          ],
        },
      ],
    },
  },
};