from sentence_transformers import SentenceTransformer
from VendorSide.models import VendorWorks
from .models import VendorEmbedding

model = SentenceTransformer('all-MiniLM-L6-v2')


def generate_embeddings():
    works = VendorWorks.objects.all()

    for work in works:
        text = f"{work.title} {work.description}"
        embedding = model.encode(text).tolist()

        VendorEmbedding.objects.update_or_create(
            vendor_work=work,
            defaults={"embedding": embedding}
        )

    print("Embeddings generated!")