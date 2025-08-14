from src.models.user import db
from datetime import datetime

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.Text, nullable=False)
    unidade = db.Column(db.String(50), default='UNIDADE')
    fornecimento = db.Column(db.Float, default=0.0)
    estoque = db.Column(db.Float, default=0.0)
    estoque_minimo = db.Column(db.Float, default=5.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Produto {self.descricao[:50]}...>'

    def to_dict(self):
        return {
            'id': self.id,
            'descricao': self.descricao,
            'unidade': self.unidade,
            'fornecimento': self.fornecimento,
            'estoque': self.estoque,
            'estoque_minimo': self.estoque_minimo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status_estoque': self.get_status_estoque()
        }
    
    def get_status_estoque(self):
        if self.estoque <= 0:
            return 'ESGOTADO'
        elif self.estoque <= self.estoque_minimo:
            return 'BAIXO'
        else:
            return 'OK'
    
    def dar_baixa(self, quantidade):
        """Dá baixa no estoque do produto"""
        if self.estoque >= quantidade:
            self.estoque -= quantidade
            self.updated_at = datetime.utcnow()
            return True
        return False
    
    def adicionar_estoque(self, quantidade):
        """Adiciona quantidade ao estoque"""
        self.estoque += quantidade
        self.updated_at = datetime.utcnow()
        return True

class MovimentacaoEstoque(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # 'ENTRADA' ou 'SAIDA'
    quantidade = db.Column(db.Float, nullable=False)
    observacao = db.Column(db.Text)
    data_movimentacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    produto = db.relationship('Produto', backref=db.backref('movimentacoes', lazy=True))

    def __repr__(self):
        return f'<Movimentacao {self.tipo} - {self.quantidade}>'

    def to_dict(self):
        return {
            'id': self.id,
            'produto_id': self.produto_id,
            'produto_descricao': self.produto.descricao if self.produto else None,
            'tipo': self.tipo,
            'quantidade': self.quantidade,
            'observacao': self.observacao,
            'data_movimentacao': self.data_movimentacao.isoformat() if self.data_movimentacao else None
        }

