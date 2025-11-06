import { UserRepository } from '../repositories/user.repository.js';
import { ENV } from '../config/env.js';
import { NotFoundError, ValidationError } from '../utils/errors.util.js';

export class TermService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Obtém o termo de responsabilidade atual
   */
  getTermDetails() {
    return {
      version: ENV.TERM_VERSION,
      content: this.getTermContent(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Método alternativo (compatibilidade)
   */
  getCurrentTerm() {
    return this.getTermDetails();
  }

  /**
   * Conteúdo do termo de responsabilidade
   */
  getTermContent() {
    return `TERMO DE RESPONSABILIDADE E ISENÇÃO

Ao utilizar este aplicativo, você reconhece e concorda com os seguintes termos:

1. RESPONSABILIDADE DO USUÁRIO
   Você é o único responsável por todas as informações, exames e dados inseridos neste aplicativo. O aplicativo não se responsabiliza por qualquer informação incorreta, incompleta ou desatualizada fornecida pelo usuário.

2. VERACIDADE DAS INFORMAÇÕES
   Você declara que todas as informações inseridas são verdadeiras e precisas, e se responsabiliza pela veracidade e atualidade dos dados fornecidos.

3. USO DOS DADOS
   O uso deste aplicativo é de total responsabilidade do usuário. Você reconhece que é responsável por:
   - A precisão e veracidade de todas as informações inseridas;
   - A segurança e privacidade de seus próprios dados;
   - As decisões tomadas com base nas informações armazenadas no aplicativo.

4. ISENÇÃO DE RESPONSABILIDADE
   O aplicativo não oferece garantias quanto à:
   - Precisão, completude ou atualidade das informações inseridas;
   - Disponibilidade contínua do serviço;
   - Segurança absoluta dos dados armazenados.

5. CONSULTA MÉDICA
   Este aplicativo não substitui consultas médicas profissionais. Sempre consulte um profissional de saúde qualificado para interpretação de exames e tomada de decisões médicas.

6. ACEITAÇÃO
   Ao aceitar este termo, você confirma que leu, compreendeu e concorda com todas as condições acima, assumindo total responsabilidade pelo uso do aplicativo.

Versão: ${ENV.TERM_VERSION}
Data de atualização: ${new Date().toLocaleDateString('pt-BR')}`;
  }

  /**
   * Aceita o termo de responsabilidade para um usuário
   */
  async acceptTerm(userId, version) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validar versão
    if (!version || version !== ENV.TERM_VERSION) {
      throw new ValidationError(`Invalid term version. Current version is ${ENV.TERM_VERSION}`);
    }

    // Atualizar usuário com aceite do termo
    const updated = await this.userRepository.update(userId, {
      termAccepted: new Date(),
      termVersion: version,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update user');
    }

    return {
      termAccepted: updated.termAccepted?.toISOString(),
      termVersion: updated.termVersion,
      message: 'Term of responsibility accepted successfully',
    };
  }

  /**
   * Verifica se o usuário aceitou o termo
   */
  async checkTermStatus(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hasAccepted = !!user.termAccepted && !!user.termVersion;
    const needsAcceptance = !hasAccepted || user.termVersion !== ENV.TERM_VERSION;

    return {
      hasAccepted,
      termAccepted: user.termAccepted?.toISOString() || null,
      termVersion: user.termVersion || null,
      currentVersion: ENV.TERM_VERSION,
      needsAcceptance,
    };
  }

  /**
   * Método alternativo (compatibilidade)
   */
  async checkTermAcceptance(userId) {
    return this.checkTermStatus(userId);
  }
}

