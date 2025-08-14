import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
from src.main import app, db
from src.models.produto import Produto

def importar_dados():
    # Ler dados da planilha
    df = pd.read_csv('/home/ubuntu/planilha_pagina3.csv')
    
    with app.app_context():
        # Limpar dados existentes
        db.drop_all()
        db.create_all()
        
        # Importar produtos
        count = 0
        for index, row in df.iterrows():
            try:
                descricao = str(row.iloc[0]) if pd.notna(row.iloc[0]) else f'Produto {index+1}'
                unidade = str(row.iloc[1]) if pd.notna(row.iloc[1]) else 'UNIDADE'
                fornecimento = float(row.iloc[2]) if pd.notna(row.iloc[2]) else 0.0
                estoque = float(row.iloc[3]) if pd.notna(row.iloc[3]) else 0.0
                
                produto = Produto(
                    descricao=descricao,
                    unidade=unidade,
                    fornecimento=fornecimento,
                    estoque=estoque,
                    estoque_minimo=5.0
                )
                
                db.session.add(produto)
                count += 1
            except Exception as e:
                print(f'Erro na linha {index}: {e}')
                continue
        
        db.session.commit()
        print(f'Importados {count} produtos com sucesso!')

if __name__ == '__main__':
    importar_dados()

