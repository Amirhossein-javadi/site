from datetime import date, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from apps.contracts.models import Contract
from apps.tenants.models import AgentCompany, Company
from apps.users.models import User


class CustomerApiTests(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(name="شرکت اول", slug="customer-company-one")
        self.other_company = Company.objects.create(name="شرکت دوم", slug="customer-company-two")
        self.user = User.objects.create_user(
            email="customer-user@example.com", password="test-password", tenant=self.company,
            role=User.Role.SALES_MANAGER,
        )
        self.client.force_authenticate(self.user)
        self.customer = AgentCompany.objects.create(tenant=self.company, name="نماینده تهران")
        self.other_customer = AgentCompany.objects.create(
            tenant=self.other_company, name="نماینده شرکت دیگر"
        )

    def test_list_search_and_active_filter_are_tenant_scoped(self):
        response = self.client.get("/api/customers/?search=تهران&is_active=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [self.customer.id])
        self.assertEqual(response.data[0]["contracts_count"], 0)

    def test_create_update_and_delete_customer(self):
        created = self.client.post(
            "/api/customers/", {"name": "نماینده جدید", "is_active": True}, format="json"
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AgentCompany.objects.get(pk=created.data["id"]).tenant, self.company)

        updated = self.client.patch(
            f"/api/customers/{created.data['id']}/",
            {"name": "نماینده ویرایش‌شده", "is_active": False},
            format="json",
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["status"], "inactive")

        deleted = self.client.delete(f"/api/customers/{created.data['id']}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AgentCompany.objects.filter(pk=created.data["id"]).exists())

    def test_customer_with_contract_cannot_be_deleted(self):
        Contract.objects.create(
            tenant=self.company,
            agent=self.customer,
            number="CT-CUSTOMER-1",
            title="قرارداد نماینده",
            device_cap=20,
            end_date=date.today() + timedelta(days=365),
        )

        response = self.client.delete(f"/api/customers/{self.customer.id}/")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(AgentCompany.objects.filter(pk=self.customer.pk).exists())
        self.assertIn("قرارداد", response.data["detail"])

    def test_other_tenant_customer_cannot_be_read_or_changed(self):
        response = self.client.get(f"/api/customers/{self.other_customer.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.patch(
            f"/api/customers/{self.other_customer.id}/", {"name": "دستکاری"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.other_customer.refresh_from_db()
        self.assertEqual(self.other_customer.name, "نماینده شرکت دیگر")

    def test_api_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/customers/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
