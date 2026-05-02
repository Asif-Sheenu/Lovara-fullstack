import numpy as np
from sentence_transformers import SentenceTransformer
from .models import VendorEmbedding

model = SentenceTransformer('all-MiniLM-L6-v2')


def search(query, k=1):
    query_vector = model.encode([query])[0]

    all_embeddings = VendorEmbedding.objects.select_related("vendor_work")

    similarities = []

    for item in all_embeddings:
        emb = np.array(item.embedding)
        score = np.dot(emb, query_vector)

        similarities.append((score, item.vendor_work))

    similarities.sort(reverse=True, key=lambda x: x[0])

    top_results = [w for _, w in similarities[:k]]

    return [
        {
            "title": w.title,
            "description": w.description
        }
        for w in top_results
    ]